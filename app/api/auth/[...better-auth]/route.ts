import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import arcjet, { detectBot, shield, validateEmail, tokenBucket } from "@arcjet/next";
import { isSpoofedBot } from "@arcjet/inspect";
import { NextRequest, NextResponse } from "next/server";

// Base Arcjet rules (no email validation) — used for GET requests
const ajBase = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE",
            allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        tokenBucket({
            mode: "LIVE",
            refillRate: 5,
            interval: 10,
            capacity: 10,
        }),
    ],
});

// Extended Arcjet rules (with email validation) — used for POST requests
const ajWithEmail = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE",
            allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        tokenBucket({
            mode: "LIVE",
            refillRate: 5,
            interval: 10,
            capacity: 10,
        }),
        validateEmail({
            mode: "LIVE",
            deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
        }),
    ],
});

// Extract email from auth request body (for signup/signin)
async function getEmailFromRequest(req: NextRequest): Promise<string | undefined> {
    try {
        const cloned = req.clone();
        const body = await cloned.json();
        return body?.email;
    } catch {
        return undefined;
    }
}

const betterAuthHandler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
    const decision = await ajBase.protect(req, { requested: 1 });

    if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 },
            );
        }
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (decision.ip.isHosting()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (decision.results.some(isSpoofedBot)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return betterAuthHandler.GET(req);
}

export async function POST(req: NextRequest) {
    const email = await getEmailFromRequest(req);

    if (email) {
        // If email is present (signup/signin), validate it
        const decision = await ajWithEmail.protect(req, {
            requested: 1,
            email,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return NextResponse.json(
                    { error: "Too many requests. Please try again later." },
                    { status: 429 },
                );
            }
            if (decision.reason.isEmail()) {
                return NextResponse.json(
                    { error: "Invalid email address. Please use a valid, non-disposable email." },
                    { status: 400 },
                );
            }
            if (decision.reason.isBot()) {
                return NextResponse.json({ error: "Bot detected" }, { status: 403 });
            }
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (decision.ip.isHosting()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (decision.results.some(isSpoofedBot)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } else {
        // No email in body — just apply base protection
        const decision = await ajBase.protect(req, { requested: 1 });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return NextResponse.json(
                    { error: "Too many requests. Please try again later." },
                    { status: 429 },
                );
            }
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (decision.ip.isHosting()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (decision.results.some(isSpoofedBot)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    return betterAuthHandler.POST(req);
}
