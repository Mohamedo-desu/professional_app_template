import { createAvatar } from "@dicebear/core";
import * as initials from "@dicebear/initials";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Webhook handler for Clerk events:
// - user.created: Creates a new user in the database
// - user.deleted: Deletes the user's data from the database
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        "Missing webhook secret. Please set CLERK_WEBHOOK_SECRET in your .env.local file."
      );
    }

    //   CHECK HEADERS
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Missing svix headers", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);

    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (error) {
      console.error("Error verifying webhook", error);
      return new Response("Error occurred", {
        status: 400,
      });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, unsafe_metadata } = evt.data;
      const email = email_addresses[0].email_address;
      const { fullName } = unsafe_metadata;

      try {
        // 2. Increment user count
        await ctx.runMutation(internal.users.increment, {});

        // 4. Generate avatar
        const avatar = createAvatar(initials, {
          seed: fullName,
          backgroundType: ["gradientLinear", "solid"],
          backgroundColor: ["4b22df", "ff9650", "219ff3"],
          radius: 50,
          scale: 120,
          translateY: 5,
        }).toString();

        // 5. Create the user
        await ctx.runMutation(internal.users.createUser, {
          emailAddress: email,
          clerkId: id,
          fullName,
          imageUrl: avatar,
        });
      } catch (error) {
        console.log("Error creating user", error);
        return new Response("Error occurred", {
          status: 500,
        });
      }
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;
      await ctx.runMutation(internal.triggers.deleteUserCascade, {
        clerkId: id,
      });
    }

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

http.route({
  path: "/version",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { version, type, releaseNotes, downloadUrl } = body;
      if (!version || !type || !releaseNotes) {
        return new Response("Missing required fields", { status: 400 });
      }

      await ctx.runMutation(internal.versioning.createVersion, {
        version,
        type,
        releaseNotes,
        downloadUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      // Map duplication error or other server errors to appropriate codes
      const message = err?.message || "Internal Server Error";
      const status = /already exists/i.test(message) ? 409 : 500;
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/version/:version",
  method: "DELETE",
  handler: httpAction(async (ctx, req) => {
    try {
      // Extract version param from URL path
      const pathname = new URL(req.url).pathname; // e.g. "/version/1.2.3"
      const parts = pathname.split("/");
      const version = decodeURIComponent(parts[parts.length - 1] || "");

      if (!version) {
        return new Response("Missing version in path", { status: 400 });
      }

      await ctx.runMutation(internal.versioning.deleteVersion, { version });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      const message = err?.message || "Internal Server Error";
      const status = /not found/i.test(message) ? 404 : 500;
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ✅ Get latest version (for web & deep link page)
http.route({
  path: "/appVersions/latest",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const latest = await ctx.runQuery(
        internal.versioning.getLatestVersion,
        {}
      );
      if (!latest) {
        return new Response(JSON.stringify({ error: "No versions found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          version: latest.version,
          type: latest.type,
          releaseNotes: latest.releaseNotes,
          downloadUrl: latest.downloadUrl,
        }),
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    } catch (err: any) {
      console.error("Error fetching latest version:", err);
      return new Response(
        JSON.stringify({ error: "Failed to fetch latest version" }),
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }
  }),
});

export default http;
