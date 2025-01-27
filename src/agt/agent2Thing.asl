wotReceivedDebugMsg.  // uncomment to see debug messages
drinkBelief(drinkId(latte), size(m)).
//drinkBelief(size(m, l)).
drink1(object(drinkId(cappuccino), size(l), quantity(2))).
!init.

+!init: true <-
    .print("Initializing agent1");
    .wait(3000);
    .print("Asking for stattus");
    wotAskOne("coffeeMachine1", "status", "properties");
    .print("Asked coffeeMachine1").

+status(idle)[source(coffeeMachine1)]: true <-
    ?drink1(Data);
    .print("Seinding data: ", Data);
    wotAchieve("coffeeMachine1", "makeDrink", Data).

{ include("wotPlans.asl") }
// This import is cruitial to work with artifacts. 
{ include("$jacamo/templates/common-cartago.asl") }