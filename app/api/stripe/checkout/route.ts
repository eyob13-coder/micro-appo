import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Pro Plan - Unlimited Uploads",
                        },
                        unit_amount: 999, // $9.99/month
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: session.user.id,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?canceled=true`,
        });

        if (checkoutSession.url) {
            return NextResponse.redirect(checkoutSession.url, 303);
        }

        return new NextResponse("Failed to create checkout session", { status: 500 });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
