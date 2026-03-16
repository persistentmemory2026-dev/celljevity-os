import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// HTTP action for file upload
http.route({
  path: "/uploadDocument",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") as any;
    const category = searchParams.get("category") || "other";
    const relatedQuoteId = searchParams.get("relatedQuoteId") as any;
    
    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }
    
    // Store file in Convex storage
    const storageId = await ctx.storage.store(file);
    
    // Create document record
    const documentId = await ctx.runMutation(api.documents.create, {
      userId,
      filename: storageId,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      storageId,
      category,
      relatedQuoteId: relatedQuoteId || undefined,
    });
    
    return Response.json({ 
      success: true, 
      documentId,
      message: "File uploaded successfully" 
    });
  }),
});

// HTTP action for file download (public via share token)
http.route({
  path: "/downloadDocument",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }
    
    const doc = await ctx.runQuery(api.documents.validateShare, { token });
    
    if (!doc) {
      return new Response("Invalid or expired token", { status: 403 });
    }
    
    if (!doc.storageId) {
      return new Response("File not found", { status: 404 });
    }
    
    const blob = await ctx.storage.get(doc.storageId);
    
    return new Response(blob, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.originalName}"`,
      },
    });
  }),
});

export default http;
