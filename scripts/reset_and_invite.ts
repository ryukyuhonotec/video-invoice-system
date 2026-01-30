
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const email = "s.o.02.0999@gmail.com";

    console.log(`Resetting staff data for ${email}...`);

    // 1. Delete existing Staff record
    const staff = await prisma.staff.findFirst({ where: { email } });
    if (staff) {
        await prisma.staff.delete({ where: { id: staff.id } });
        console.log(`Deleted existing staff record: ${staff.id}`);
    } else {
        console.log("No existing staff record found.");
    }

    // 2. Delete existing invitations
    await prisma.staffInvitation.deleteMany({ where: { email } });
    console.log("Deleted existing invitations.");

    // 3. Create new invitation
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    // We need a creator ID. If no admin exists, use the user's ID itself or a dummy.
    // Based on previous logs, user ID 'cmkzkyr3v0000wp466m39pqip' exists.
    // Or we can just use a placeholder if the schema allows (it's a string).
    // Let's use the user's own UserId as creator if possible, or just search for any user.
    const creator = await prisma.user.findFirst();
    const creatorId = creator ? creator.id : "system";

    const invitation = await prisma.staffInvitation.create({
        data: {
            email: email,
            name: "Shogo Ono Test",
            staffRole: "OPERATIONS", // 事業統括
            expiresAt: expiration,
            createdBy: creatorId
            // status field does not exist in DB schema
        }
    });

    console.log("\n>>> INVITATION URL <<<");
    console.log(`http://localhost:3001/invite/${invitation.token}`);
    console.log(">>> Use this URL to register in the Incognito window or after logging out <<<");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
