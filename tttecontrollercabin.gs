include "DefaultLocomotiveCabin.gs"

class tttecontrollercabin isclass DefaultLocomotiveCabin
{
	Locomotive loco;

	//Forwards all ControlSet messages to the locomotive, since we can't get the cabin object of a loco for some reason
	public void Init(void) {
		inherited();

		//loco = cast<Locomotive>me.GetParentObject();

		//loco.Sniff(me, "ControlSet", "", true);
		//PostMessage(loco, "Cabin", "InitCabin", 0.0);
	}

	public void Attach(GameObject obj)
	{
		inherited(obj);
		loco = cast<Locomotive>(obj);
		if(loco) loco.Sniff(me, "ControlSet", "", true);
	}

	public void Detach()
	{
		inherited();
		if(loco) loco.Sniff(me, "ControlSet", "", false);
	}
};
