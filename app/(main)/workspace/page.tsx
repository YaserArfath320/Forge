import { getWorkspaceById, getWorkspaceUser } from '@/actions/worskpace';
import WorkspaceClient from '@/components/workspaceClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface WorkspacePageProps {
    searchParams: Promise<{
        prompt?: string;
        id?: string
    }>;
}

const WorkspacePage = async ({ searchParams }: WorkspacePageProps) => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const { prompt, id } = await searchParams;

    const user = await getWorkspaceUser();

    let workspace = null;
    if (id) {
        workspace = await getWorkspaceById(id, user.id);
    }

    return (
        <WorkspaceClient
            initialPrompt={prompt ?? null}
            userCredits={user.credits}
            userId={user.id}
            userPlan={user.plan}
            workspace={workspace}
        />
    );
};

export default WorkspacePage