include "Browser.gs"
include "TTTELocomotive.gs"
class ObjectListPrompt
{
  Browser browser;
  string GetPromptHTML();
  string searchQuery = "";
  GameObjectID selectedObject;
  NamedObjectInfo[] WorldObjects;
  tttelocomotive LocoRef;
  public void Init(tttelocomotive loco)
  {
    LocoRef = loco;
    browser = null;
    browser = Constructors.NewBrowser();
    browser.SetCloseEnabled(true);
    int width = 300;
    int height = 400;
    browser.SetWindowPosition(Interface.GetDisplayWidth() / 2 - width / 2, Interface.GetDisplayHeight() / 2 - height / 2);
    browser.SetWindowSize(width, height);
    browser.SetWindowVisible(true);
    browser.LoadHTMLString(LocoRef.GetAsset(), GetPromptHTML());
  }

  void RefreshBrowser()
  {
    browser.LoadHTMLString(LocoRef.GetAsset(), GetPromptHTML());
  }

  string GetPromptHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("Select an asset.");

    AsyncObjectSearchResult WorldObjectsSearch = World.GetNamedObjectList("", searchQuery);
    WorldObjectsSearch.SynchronouslyWaitForResults();
    WorldObjects = WorldObjectsSearch.GetResults();

    output.Print("<table>");
      //selection
      output.Print("<tr>");
        output.Print("<td width=280>"); // bgcolor=#757575
          output.Print("<trainz-object width=280 height=20 id=search style=edit-box></trainz-object>");
        output.Print("</td>");
      output.Print("</tr>");
      int i;
      for(i = 0; i < WorldObjects.size(); i++)
      {
        NamedObjectInfo Obj = WorldObjects[i];
        bool Selected = false;
        if(selectedObject != null)
          Selected = Obj.objectId.DoesMatch(selectedObject);

        output.Print("<a href='live://select_" + (string)i + "'><tr bgcolor=");
        if(Selected)
          output.Print("#757575");
        else
          output.Print("#1a1a1a");
        output.Print("><td>");

            output.Print(Obj.localisedUsername);
        output.Print("</td></tr></a>");
      }
    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  public void SearchTick()
  {
    string tempSearchQuery = browser.GetElementProperty("search", "text");
    if(tempSearchQuery != searchQuery)
    {
      RefreshBrowser();
      searchQuery = tempSearchQuery;
    }
  }

  public void ProcessBrowserCommand(string command)
  {
    if(command == "user_add")
    {

    }
  }
};
