/**
 * SCARCITY & PRE-ORDER DROP ENGINE
 * =================================
 * Hyper-Luxury E-Commerce Platform - Backend API
 * 
 * ARCHITECTURE NOTES:
 * - Race-condition proof via PostgreSQL SELECT FOR UPDATE + SERIALIZABLE transactions
 * - Stripe Checkout Session with pre-order metadata
 * - Zero architecture leakage in error responses
 * - Strict TypeScript typing throughout
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
import Stripe from 'stripe';

// ============================================================================
// CONFIGURATION - Environment Variables (Validate at startup)
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Connection pool size for high-concurrency drops
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ============================================================================
// TYPE DEFINITIONS - Strict Typing for Type Safety
// ============================================================================

interface DropProduct {
  product_id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  quantity_available: number;
  quantity_reserved: number;
  drop_start: Date;
  drop_end: Date;
  is_active: boolean;
}

interface PreOrderRequest {
  product_id: string;
  quantity: number;
  customer_email: string;
  customer_name?: string;
  metadata?: Record<string, string>;
}

interface PreOrderSuccessResponse {
  status: 'success';
  checkout_url: string;
  session_id: string;
  reserved_until: string;
  message: string;
}

interface PreOrderErrorResponse {
  status: 'error';
  code: 
    | 'PRODUCT_NOT_FOUND'
    | 'DROP_NOT_ACTIVE'
    | 'INSUFFICIENT_INVENTORY'
    | 'QUANTITY_LIMIT_EXCEEDED'
    | 'RESERVATION_FAILED'
    | 'STRIPE_ERROR'
    | 'INVALID_REQUEST';
  message: string;
  retry_after?: number; // Seconds until retry allowed
}

type PreOrderResponse = PreOrderSuccessResponse | PreOrderErrorResponse;

// ============================================================================
// UTILITY FUNCTIONS - Internal Logic
// ============================================================================

/**
 * Validates the incoming request payload
 * SECURITY: Never expose validation details to client
 */
function validateRequest(body: unknown): body is PreOrderRequest {
  if (!body || typeof body !== 'object') return false;
  
  const req = body as Record<string, unknown>;
  
  if (typeof req.product_id !== 'string' || !req.product_id.trim()) return false;
  if (typeof req.quantity !== 'number' || req.quantity < 1 || req.quantity > 10) return false;
  if (typeof req.customer_email !== 'string' || !req.customer_email.includes('@')) return false;
  if (req.customer_name !== undefined && typeof req.customer_name !== 'string') return false;
  if (req.metadata !== undefined && (typeof req.metadata !== 'object' || req.metadata === null)) return false;
  
  return true;
}

/**
 * Formats a luxury error response without leaking system details
 */
function createErrorResponse(
  code: PreOrderErrorResponse['code'],
  message: string,
  retryAfter?: number
): NextResponse<PreOrderErrorResponse> {
  const response: PreOrderErrorResponse = {
    status: 'error',
    code,
    message,
    ...(retryAfter && { retry_after: retryAfter }),
  };

  return NextResponse.json(response, { 
    status: code === 'INSUFFICIENT_INVENTORY' ? 409 : 400,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

/**
 * Checks if a drop is currently active based on time windows
 */
function isDropActive(drop: DropProduct): boolean {
  const now = new Date();
  return drop.is_active && 
         now >= drop.drop_start && 
         now <= drop.drop_end;
}

/**
 * Calculates available inventory (available - reserved)
 */
function getAvailableInventory(drop: DropProduct): number {
  return Math.max(0, drop.quantity_available - drop.quantity_reserved);
}

// ============================================================================
// CORE TRANSACTION LOGIC - Race-Condition Proof
// ============================================================================

/**
 * EXECUTES THE ATOMIC RESERVATION TRANSACTION
 * 
 * This is the CRITICAL section that prevents race conditions:
 * 1. Opens SERIALIZABLE transaction (strictest isolation level)
 * 2. SELECT ... FOR UPDATE SKIP LOCKED - locks the row, skips if already locked
 * 3. Validates inventory availability within transaction
 * 4. Increments reserved quantity atomically
 * 5. Commits only if all checks pass
 * 
 * If two requests hit simultaneously:
 * - First one acquires the lock and proceeds
 * - Second one either waits (default) or gets skipped (SKIP LOCKED behavior)
 * - Second one re-reads and sees updated inventory, fails if insufficient
 */
async function executeReservationTransaction(
  client: PoolClient,
  productId: string,
  quantity: number
): Promise<{ success: boolean; available?: number; error?: string }> {
  try {
    // Start SERIALIZABLE transaction for maximum isolation
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // LOCK THE ROW - This is the race-condition prevention mechanism
    // FOR UPDATE: Exclusive lock on selected rows
    // SKIP LOCKED: Don't wait if another transaction holds the lock
    const lockQuery = `
      SELECT 
        product_id,
        quantity_available,
        quantity_reserved,
        drop_start,
        drop_end,
        is_active
      FROM core.inventory
      WHERE product_id = $1
      FOR UPDATE SKIP LOCKED
    `;
    
    const lockResult = await client.query(lockQuery, [productId]);

    // If no rows returned, another transaction holds the lock
    // This means extreme concurrency - fail gracefully
    if (lockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'CONCURRENT_ACCESS' };
    }

    const row = lockResult.rows[0];
    const drop: DropProduct = {
      product_id: row.product_id,
      name: '', // Not needed for reservation
      description: '',
      price_cents: 0,
      currency: 'USD',
      quantity_available: parseInt(row.quantity_available, 10),
      quantity_reserved: parseInt(row.quantity_reserved, 10),
      drop_start: row.drop_start,
      drop_end: row.drop_end,
      is_active: row.is_active,
    };

    // Validate drop is still active (within transaction for consistency)
    if (!isDropActive(drop)) {
      await client.query('ROLLBACK');
      return { success: false, error: 'DROP_NOT_ACTIVE' };
    }

    const available = getAvailableInventory(drop);

    // Check if sufficient inventory exists
    if (quantity > available) {
      await client.query('ROLLBACK');
      return { success: false, available, error: 'INSUFFICIENT_INVENTORY' };
    }

    // ATOMIC UPDATE - Increment reserved quantity
    const updateQuery = `
      UPDATE core.inventory
      SET quantity_reserved = quantity_reserved + $1,
          updated_at = NOW()
      WHERE product_id = $2
      RETURNING quantity_reserved, quantity_available
    `;
    
    await client.query(updateQuery, [quantity, productId]);

    // Commit the transaction
    await client.query('COMMIT');

    return { success: true, available: available - quantity };
  } catch (error) {
    // Rollback on any error (serialization failure, timeout, etc.)
    await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    
    // Log internally but don't expose details
    console.error('[TRANSACTION_ERROR]', {
      productId,
      quantity,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false, error: 'TRANSACTION_FAILED' };
  }
}

/**
 * Creates a Stripe Checkout Session for pre-orders
 * Includes custom metadata for fulfillment tracking
 */
async function createStripeSession(
  product: DropProduct,
  quantity: number,
  customerEmail: string,
  customerName?: string,
  metadata?: Record<string, string>
): Promise<{ sessionUrl: string; sessionId: string }> {
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: product.currency.toLowerCase() as 'usd' | 'eur' | 'gbp',
          product_data: {
            name: product.name,
            description: product.description,
            metadata: {
              product_id: product.product_id,
              is_pre_order: 'true',
            },
          },
          unit_amount: product.price_cents,
        },
        quantity,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_intent_data: {
        capture_method: 'automatic', // Capture immediately for pre-orders
        metadata: {
          product_id: product.product_id,
          quantity: quantity.toString(),
          is_pre_order: 'true',
          drop_type: 'limited_edition',
          ...metadata,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/product/${product.product_id}?cancelled=true`,
      customer_email: customerEmail,
      client_reference_id: `${product.product_id}_${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minute expiration
      metadata: {
        product_id: product.product_id,
        quantity: quantity.toString(),
        customer_name: customerName || '',
        is_pre_order: 'true',
        fulfillment_status: 'pending_drop',
        ...metadata,
      },
      // Luxury branding options
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'JP', 'AE'],
      },
    });

    if (!session.url) {
      throw new Error('Stripe session URL not generated');
    }

    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[STRIPE_ERROR]', {
      productId: product.product_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Fetches product/drop information from database
 */
async function fetchDropProduct(productId: string): Promise<DropProduct | null> {
  const query = `
    SELECT 
      product_id,
      name,
      description,
      price_cents,
      currency,
      quantity_available,
      quantity_reserved,
      drop_start,
      drop_end,
      is_active
    FROM core.inventory
    WHERE product_id = $1
  `;

  try {
    const result = await pool.query(query, [productId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      product_id: row.product_id,
      name: row.name,
      description: row.description,
      price_cents: parseInt(row.price_cents, 10),
      currency: row.currency,
      quantity_available: parseInt(row.quantity_available, 10),
      quantity_reserved: parseInt(row.quantity_reserved, 10),
      drop_start: row.drop_start,
      drop_end: row.drop_end,
      is_active: row.is_active,
    };
  } catch (error) {
    console.error('[DB_FETCH_ERROR]', { productId, error });
    return null;
  }
}

// ============================================================================
// MAIN API HANDLER - POST /api/checkout/pre-order
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<PreOrderResponse>> {
  // Set strict security headers for all responses
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  let client: PoolClient | null = null;

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { status: 'error', code: 'INVALID_REQUEST', message: 'Invalid request format' } as PreOrderErrorResponse,
        { status: 400, headers: securityHeaders }
      );
    }

    if (!validateRequest(body)) {
      return createErrorResponse('INVALID_REQUEST', 'Invalid request parameters');
    }

    const { product_id, quantity, customer_email, customer_name, metadata } = body;

    // Fetch product/drop information
    const product = await fetchDropProduct(product_id);

    if (!product) {
      return createErrorResponse('PRODUCT_NOT_FOUND', 'This item is no longer available');
    }

    // Verify drop is active
    if (!isDropActive(product)) {
      const now = new Date();
      if (now < product.drop_start) {
        return createErrorResponse(
          'DROP_NOT_ACTIVE',
          'This exclusive drop has not yet begun',
          Math.ceil((product.drop_start.getTime() - now.getTime()) / 1000)
        );
      } else {
        return createErrorResponse('DROP_NOT_ACTIVE', 'This exclusive drop has concluded');
      }
    }

    // Quick pre-check for inventory (optimization before transaction)
    const quickAvailable = getAvailableInventory(product);
    if (quantity > quickAvailable) {
      return createErrorResponse(
        'INSUFFICIENT_INVENTORY',
        'Only ${quickAvailable} piece(s) remain in this exclusive collection',
        30
      );
    }

    // Acquire database client for transaction
    client = await pool.connect();

    // EXECUTE RACE-CONDITION PROOF TRANSACTION
    const reservationResult = await executeReservationTransaction(client, product_id, quantity);

    if (!reservationResult.success) {
      switch (reservationResult.error) {
        case 'CONCURRENT_ACCESS':
          // Another user grabbed it milliseconds ago
          return createErrorResponse(
            'RESERVATION_FAILED',
            'Another collector secured this piece moments ago',
            5
          );
        
        case 'DROP_NOT_ACTIVE':
          return createErrorResponse('DROP_NOT_ACTIVE', 'This drop is no longer active');
        
        case 'INSUFFICIENT_INVENTORY':
          return createErrorResponse(
            'INSUFFICIENT_INVENTORY',
            reservationResult.available !== undefined && reservationResult.available === 0
              ? 'Sold Out - Join the waitlist for future access'
              : `Only ${reservationResult.available} piece(s) remain`,
            30
          );
        
        default:
          return createErrorResponse(
            'RESERVATION_FAILED',
            'Unable to secure your reservation. Please try again',
            10
          );
      }
    }

    // Reservation successful - Create Stripe Checkout Session
    let sessionData: { sessionUrl: string; sessionId: string };
    
    try {
      sessionData = await createStripeSession(
        product,
        quantity,
        customer_email,
        customer_name,
        metadata
      );
    } catch {
      // ROLLBACK the reservation if Stripe fails
      await client.query(`
        UPDATE core.inventory
        SET quantity_reserved = quantity_reserved - $1
        WHERE product_id = $2
      `, [quantity, product_id]);
      
      return createErrorResponse('STRIPE_ERROR', 'Unable to initialize secure checkout');
    }

    // Calculate reservation expiry (15 minutes for checkout completion)
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // SUCCESS RESPONSE
    const successResponse: PreOrderSuccessResponse = {
      status: 'success',
      checkout_url: sessionData.sessionUrl,
      session_id: sessionData.sessionId,
      reserved_until: reservedUntil,
      message: `Your exclusive piece is reserved for 15 minutes. Complete your pre-order to secure ownership.`,
    };

    return NextResponse.json(successResponse, { 
      status: 200, 
      headers: securityHeaders 
    });

  } catch (error) {
    // CATCH-ALL for unexpected errors
    // SECURITY: Never expose stack traces or internal details
    console.error('[UNEXPECTED_ERROR]', {
      path: '/api/checkout/pre-order',
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return createErrorResponse(
      'INVALID_REQUEST',
      'Service temporarily unavailable. Please try again shortly',
      60
    );
  } finally {
    // Always release the database connection
    if (client) {
      client.release();
    }
  }
}

// ============================================================================
// GET HANDLER - For health checks and drop status
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const productId = request.nextUrl.searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID required' },
      { status: 400 }
    );
  }

  try {
    const product = await fetchDropProduct(productId);

    if (!product) {
      return NextResponse.json(
        { status: 'not_found', message: 'Product not found' },
        { status: 404 }
      );
    }

    const available = getAvailableInventory(product);
    const isActive = isDropActive(product);
    const now = new Date();

    return NextResponse.json({
      status: 'success',
      product: {
        id: product.product_id,
        name: product.name,
        price_cents: product.price_cents,
        currency: product.currency,
      },
      drop: {
        is_active: isActive,
        starts_at: product.drop_start.toISOString(),
        ends_at: product.drop_end.toISOString(),
        time_until_start: product.drop_start > now 
          ? Math.max(0, Math.floor((product.drop_start.getTime() - now.getTime()) / 1000))
          : 0,
        time_remaining: isActive && product.drop_end > now
          ? Math.max(0, Math.floor((product.drop_end.getTime() - now.getTime()) / 1000))
          : 0,
      },
      inventory: {
        available,
        total: product.quantity_available,
        reserved: product.quantity_reserved,
        is_sold_out: available === 0,
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[GET_DROP_STATUS_ERROR]', { productId, error });
    return NextResponse.json(
      { status: 'error', message: 'Unable to fetch drop status' },
      { status: 500 }
    );
  }
}
