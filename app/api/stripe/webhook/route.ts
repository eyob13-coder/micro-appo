import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        if (session.metadata?.userId) {
            await prisma.user.update({
                where: { id: session.metadata.userId },
                data: { isPro: true, stripeCustomerId: session.customer as string }
            });
        }
    }

    return NextResponse.json({ received: true });
}
