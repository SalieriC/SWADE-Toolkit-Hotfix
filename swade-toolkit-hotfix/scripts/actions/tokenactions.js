var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Hooks.on("ready", () => {
    game.settings.register("swade-toolkit", "enableDragDropActions", {
        name: game.i18n.localize("Token_Action.Enable_Drag_Drop_Action"),
        hint: game.i18n.localize('Token_Action.Enable_Drag_Drop_Hint'),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
});
Hooks.on("renderTokenHUD", (tokenHUD, html, opts) => __awaiter(this, void 0, void 0, function* () {
    let currentActor = canvas.tokens.get(opts._id).actor;
    const actionsButton = $(`<i id='actionsList' class="control-icon fas fa-gavel swade-hud-actions" title=${game.i18n.localize("SWADE_Actions.Actions")}></i>`);
    //@ts-ignore
    let actionsList = yield renderTemplate('modules/swade-toolkit/templates/actions/ActionsList.hbs', getActionsList(currentActor, Array.from(currentActor.items)));
    actionsButton.append(actionsList);
    html.find(".right").append(actionsButton);
    if (game.settings.get('swade-toolkit', 'enableDragDropActions')) {
        //make the thingies drag droppable
        //@ts-ignore
        const dragDrop = new DragDrop({
            dragSelector: ".swade-action",
            dropSelector: "#board",
            callbacks: {
                dragstart: (evt) => __awaiter(this, void 0, void 0, function* () {
                    evt.dataTransfer.setData("text/plain", JSON.stringify(evt.target.dataset));
                    evt.stopPropagation();
                }),
                drop: handleActionDrop
            }
        });
        //@ts-ignore
        dragDrop.bind(document); //CURRENT KILLS THE ACTOR DROP HANDLER 
    }
    //Handle regular clicks as well
    html.find(".swade-action").on("click", (evt) => __awaiter(this, void 0, void 0, function* () {
        let item = currentActor.items.find(el => el.id == evt.target.dataset.itemId);
        let actionId = evt.target.dataset.actionId;
        yield game.swade.itemChatCardHelper.handleAction(item, currentActor, actionId);
    }));
}));
function handleActionDrop(evt) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let data = JSON.parse(evt.dataTransfer.getData('text/plain'));
        if (!data.actionId) {
            return;
        } //not an action, don't worry about it
        const getTokenAtXY = (clientX, clientY) => {
            let token = undefined;
            let gridSize = game.scenes.active.data['grid'];
            const t = canvas.stage.worldTransform;
            let x = (clientX - t.tx) / canvas.stage.scale.x;
            let y = (clientY - t.ty) / canvas.stage.scale.y;
            const inRange = (val, min, max) => {
                let inRange = (val >= min && val <= max) ? true : false;
                return inRange;
            };
            for (let tok of canvas.tokens.placeables) {
                if (inRange(x, tok.position._x, tok.position._x + gridSize) && inRange(y, tok.position._y, tok.position._y + gridSize)) {
                    return tok;
                }
            }
            return token;
        };
        let token = getTokenAtXY(evt.clientX, evt.clientY);
        //Set the dropped token as target
        //Doesn't do anything, assumes transformers will need this information for their magic
        if (token) {
            //this await might be unnecessary but like w/e
            yield token.setTarget(true, game.user, true, false);
        }
        //handle the action
        //let actor = game.actors.get(data.actorId);
        let actor = (_a = canvas.tokens.controlled[0]) === null || _a === void 0 ? void 0 : _a.actor; //otherwise it'll always grab from the unlinked default sheet and not the specific token sheet
        if (!actor) {
            return;
        } //no actor is selected so we don't have an origin 
        let item = actor.items.find(el => el.id == data.itemId);
        console.debug("SWADE Toolkit | Firing Action", item, actor, data.actionId);
        yield game.swade.itemChatCardHelper.handleAction(item, actor, data.actionId);
    });
}
function getActionsList(actor, actorItems) {
    let actionsList = [];
    //basic damage and skill rolls
    for (let item of actorItems) {
        if (item.data.data.actions && item.data.data.equipped) {
            //basic skill and damage roll for the weapon
            actionsList.push({
                name: item.name + ":" + item.data.data.actions.skill,
                img: item.img,
                itemID: item.id,
                actorID: actor.id,
                actionID: "formula"
            });
            actionsList.push({
                name: item.name + ":Damage",
                img: item.img,
                itemID: item.id,
                actorID: actor.id,
                actionID: "damage"
            });
            if (game.settings.get('swade', 'ammoManagement')) {
                actionsList.push({
                    name: item.name + ":Reload",
                    img: item.img,
                    itemID: item.id,
                    actorID: actor.id,
                    actionID: 'reload'
                });
            }
            let itemActions = item.data.data.actions.additional;
            for (let key of Object.keys(itemActions)) {
                let action = itemActions[key];
                actionsList.push({
                    name: item.name + ":" + action.name,
                    img: item.img,
                    itemID: item.id,
                    actorID: actor.id,
                    actionID: key
                }); // don't need anything else as I can look it up with Item+ActionID (already know Actor for selected Token)
            }
        }
    }
    return actionsList;
}
