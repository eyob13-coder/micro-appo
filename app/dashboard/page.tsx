import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, Video, FileText, ArrowLeft, Trash2 } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
                <h1 className="text-2xl font-bold">Please log in to view your dashboard</h1>
                <Link href="/" className="px-6 py-2 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition">Go Home</Link>
            </div>
        );
    }

    const savedInteractions = await prisma.userInteraction.findMany({
        where: {
            userId: session.user.id,
            type: 'save'
        },
        include: {
            lesson: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Your Library</h1>
                            <p className="text-zinc-400">Welcome back, {session.user.name}</p>
                        </div>
                    </div>
                </header>

                {savedInteractions.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
                        <Brain size={48} className="mx-auto text-zinc-700 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400">No saved lessons yet</h3>
                        <p className="text-zinc-600 mt-2">Start learning and save interesting snippets!</p>
                        <Link href="/" className="inline-block mt-6 px-8 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition">
                            Start Learning
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedInteractions.map((interaction) => (
                            <div key={interaction.id} className="group p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:scale-[1.02] relative">
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${interaction.lesson.type === 'video' ? 'bg-red-500/10 text-red-500' :
                                            interaction.lesson.type === 'mcq' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {interaction.lesson.type === 'video' && <Video size={12} />}
                                        {interaction.lesson.type === 'mcq' && <Brain size={12} />}
                                        {interaction.lesson.type === 'summary' && <FileText size={12} />}
                                        {interaction.lesson.type}
                                    </span>

                                    <h3 className="text-lg font-bold leading-tight line-clamp-3">
                                        {interaction.lesson.content}
                                    </h3>

                                    <p className="text-xs text-zinc-500 font-medium">
                                        Saved {new Date(interaction.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
