// Change selected tokens' sheets back to default.

async function main() {
    for (let token of canvas.tokens.controlled) {
        await token.actor.setFlag("core", "sheetClass", "Default");
        await token.update({
            'actorData.permission.default': ENTITY_PERMISSIONS.NONE,
            overlayEffect : ''
        });
    }
}
main();
