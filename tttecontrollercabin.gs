include "tttethomascabin.gs"

class tttecontrollercabin isclass tttethomascabin
{
	Locomotive loco;
	
	//Forwards all ControlSet messages to the locomotive, since we can't get the cabin object of a loco for some reason
	public void Init(void) {
		inherited();

		loco = cast<Locomotive>me.GetParentObject();
		
		loco.Sniff(me, "ControlSet", "", true);
		//PostMessage(loco, "Cabin", "InitCabin", 0.0);
	}
};