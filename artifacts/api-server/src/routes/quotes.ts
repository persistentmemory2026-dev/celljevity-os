import { Router } from "express";
import { db, quotes, quoteItems, services } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schema
const createQuoteSchema = z.object({
  type: z.enum(["quote", "invoice"]).default("quote"),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    serviceId: z.string().uuid(),
    quantity: z.number().min(1).default(1),
  })).min(1),
  notes: z.string().optional(),
  taxRate: z.number().default(19),
});

// Generate quote number: QUO-YYYYMMDD-XXXX or INV-YYYYMMDD-XXXX
async function generateQuoteNumber(type: "quote" | "invoice") {
  const prefix = type === "quote" ? "QUO" : "INV";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  
  // Get count for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await db.select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(quotes)
    .where(
      sql`${quotes.createdAt} >= ${today} AND ${quotes.type} = ${type}`
    );
  
  const sequence = (count[0]?.count || 0) + 1;
  const sequenceStr = sequence.toString().padStart(4, "0");
  
  return `${prefix}-${date}-${sequenceStr}`;
}

// GET /api/quotes
router.get("/", async (req, res) => {
  try {
    const { type = "quote" } = req.query;
    
    const allQuotes = await db.query.quotes.findMany({
      where: and(
        eq(quotes.userId, req.session.userId!),
        eq(quotes.type, type as string)
      ),
      orderBy: desc(quotes.createdAt),
      with: {
        items: true,
      },
    });

    res.json({ quotes: allQuotes });
  } catch (error) {
    console.error("Get quotes error:", error);
    res.status(500).json({ error: "Failed to get quotes" });
  }
});

// GET /api/quotes/:id
router.get("/:id", async (req, res) => {
  try {
    const quote = await db.query.quotes.findFirst({
      where: and(
        eq(quotes.id, req.params.id),
        eq(quotes.userId, req.session.userId!)
      ),
      with: {
        items: {
          with: {
            service: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    res.json({ quote });
  } catch (error) {
    console.error("Get quote error:", error);
    res.status(500).json({ error: "Failed to get quote" });
  }
});

// POST /api/quotes
router.post("/", async (req, res) => {
  try {
    const data = createQuoteSchema.parse(req.body);
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber(data.type);
    
    // Calculate totals
    let subtotal = 0;
    const itemsToInsert = [];
    
    for (const item of data.items) {
      const service = await db.query.services.findFirst({
        where: eq(services.id, item.serviceId),
      });
      
      if (!service) {
        return res.status(400).json({ error: `Service ${item.serviceId} not found` });
      }
      
      const unitPrice = parseFloat(service.price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      
      itemsToInsert.push({
        serviceId: item.serviceId,
        serviceName: service.name,
        quantity: item.quantity,
        unitPrice: service.price,
        total: itemTotal.toFixed(2),
      });
    }
    
    const taxRate = data.taxRate;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Create quote
    const [newQuote] = await db.insert(quotes).values({
      userId: req.session.userId!,
      quoteNumber,
      type: data.type,
      status: "draft",
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes,
    }).returning();
    
    // Create items
    await db.insert(quoteItems).values(
      itemsToInsert.map(item => ({
        quoteId: newQuote.id,
        ...item,
      }))
    );
    
    // Fetch complete quote
    const completeQuote = await db.query.quotes.findFirst({
      where: eq(quotes.id, newQuote.id),
      with: {
        items: {
          with: {
            service: true,
          },
        },
      },
    });
    
    res.status(201).json({ quote: completeQuote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Create quote error:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
});

// PUT /api/quotes/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    const [updated] = await db.update(quotes)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(quotes.id, req.params.id),
        eq(quotes.userId, req.session.userId!)
      ))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Quote not found" });
    }
    
    res.json({ quote: updated });
  } catch (error) {
    console.error("Update quote status error:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});

// DELETE /api/quotes/:id
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db.delete(quotes)
      .where(and(
        eq(quotes.id, req.params.id),
        eq(quotes.userId, req.session.userId!)
      ))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Quote not found" });
    }
    
    res.json({ message: "Quote deleted" });
  } catch (error) {
    console.error("Delete quote error:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

export default router;
