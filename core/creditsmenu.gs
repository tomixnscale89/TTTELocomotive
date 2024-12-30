include "tttemenu.gs"


class CreditsMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }

  public void Init()
  {

  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    // Localized description.
    string str = TrainUtil.StrSubst(base.ScriptCredits, "\n", "<br>");
    output.Print(str);

    output.Print("<br>");
    output.Print("<a href='live://more-info'>For more info, click here!</a>");

    output.Print("</body></html>");
    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:103374>";
  }

  public void ProcessMessage(string cmd)
  {
    if(cmd == "live://more-info")
    {
      TrainzScript.Log("Opening external browser");
      TrainzScript.OpenURL("https://online.ts2009.com/mediaWiki/index.php/TTTELocomotive");
    }

    base.RefreshBrowser();
  }


};