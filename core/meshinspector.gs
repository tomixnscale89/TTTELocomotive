include "gs.gs"
include "asset.gs"
include "browser.gs"
include "trainzassetsearch.gs"

// ============================================================================
// Name: MeshInspector
// Desc: Custom mesh inspector window.
// ============================================================================
class MeshInspector isclass GameObject
{
  MeshObject m_object;
  Asset m_asset;

  Soup m_config;
  GameObject m_parent;
  Browser m_browser;

  bool m_bIsOpen;
  bool m_bQueryComplete;
  bool m_bQueryFailed;

  AsyncQueryHelper m_configQuery;
  public string[] m_meshTable;
  public bool[] m_meshState;
  public string[] m_meshAttachments;
  
  void Refresh();
  void LoadMeshTable(Soup meshTable);

  public void Init(MeshObject mesh, GameObject parent)
  {
    m_object = mesh;
    m_parent = parent;
    m_asset = m_object.GetAsset();
    m_meshTable = new string[0];
    m_meshState = new bool[0];
    m_meshAttachments = new string[0];

    m_bQueryComplete = false;
    m_bQueryFailed = false;
    m_configQuery = m_asset.CacheConfigSoup();
    me.Sniff(m_configQuery, "AsyncQuery", "", true);

    m_browser = Constructors.NewBrowser();
    m_bIsOpen = true;
    
    AddHandler(me, "Browser-URL", "", "OnBrowserURL");
    AddHandler(me, "AsyncQuery", "Failure", "OnQueryFailed");
    AddHandler(me, "AsyncQuery", "AsyncResult", "OnQueryResult");

    Refresh();
  }

  public void Close()
  {
    m_browser = null;
    m_configQuery = null;
    m_bIsOpen = false;
  }

  void OnQueryFailed(Message msg)
  {
    if (!msg or msg.dst != m_configQuery or !m_bIsOpen)
      return;
    
    m_bQueryComplete = true;
    m_bQueryFailed = true;
    Refresh();
  }

  void OnQueryResult(Message msg)
  {
    if (!msg or msg.dst != m_configQuery or !m_bIsOpen)
      return;
    
    m_bQueryComplete = true;
    m_bQueryFailed = false;

    // NOTE: GetConfigSoup should fall through to GetConfigSoupCached()
    // without requiring us to bump the build number to 4.9/5.0
    // m_config = m_asset.GetConfigSoupCached();
    m_config = m_asset.GetConfigSoup();
    Soup meshTable = m_config.GetNamedSoup("mesh-table");
    LoadMeshTable(meshTable);

    Refresh();
  }

  void OnBrowserURL(Message msg)
  {
    if (!m_browser or msg.src != m_browser or !m_bIsOpen)
      return;
    
    if(TrainUtil.HasPrefix(msg.minor, "live://toggle-mesh/"))
    {
      string command = msg.minor["live://toggle-mesh/".size(),];
      if(command)
      {
        int iMesh = Str.ToInt(command);
        m_meshState[iMesh] = !m_meshState[iMesh];
        m_object.SetMeshVisible(m_meshTable[iMesh], m_meshState[iMesh], 0.0);
      }

      Refresh();
    }
  }

  void LoadMeshTable(Soup meshTable)
  {
    m_meshTable = new string[0];
    m_meshState = new bool[0];
    m_meshAttachments = new string[0];

    int iMesh;
    int iEffect;

    for(iMesh = 0; iMesh < meshTable.CountTags(); ++iMesh)
    {
      string meshName = meshTable.GetIndexedTagName(iMesh);
      Soup mesh = meshTable.GetNamedSoup(meshName);
      if (!mesh)
        continue;

      m_meshTable[m_meshTable.size()] = meshName;
      m_meshState[m_meshState.size()] = mesh.GetNamedTagAsBool("auto-create", false);

      Soup effects = mesh.GetNamedSoup("effects");
      if (!effects)
        continue;

      for (iEffect = 0; iEffect < effects.CountTags(); ++iEffect)
      {
        string effectName = effects.GetIndexedTagName(iEffect);

        Soup effect = effects.GetNamedSoup(effectName);
        if (!effect)
          continue;
        
        string effectKind = effect.GetNamedTag("kind");
        if (effectKind != "attachment")
          continue;
        
        m_meshAttachments[m_meshAttachments.size()] = effectName;
      }
    }

  }

  public string LabeledCheckbox(string link, bool value, string label)
  {
    return "<table><tr><td valign=center>" + HTMLWindow.CheckBox(link, value) + "</td><td valign=center>" + label + "</td></tr></table>";
  }

  string GetHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    output.Print(m_asset.GetLocalisedName());
    output.Print("<br>");

    // Asset preview.
    output.Print("<trainz-object width=100% height=200 style=preview asset='" + m_asset.GetKUID().GetHTMLString() + "'></trainz-object>");

    output.Print("<br>");

    if (!m_bQueryComplete)
    {
      output.Print("Loading...");
    }
    else if (m_bQueryFailed)
    {
      output.Print("Failed to load config.");
    }
    else
    {
      output.Print("<table width=100% cellspacing=2 cellpadding=2>");

      int i;
      for (i = 0; i < m_meshTable.size(); i++)
      {
        output.Print("<tr><td>");
        output.Print(LabeledCheckbox("live://toggle-mesh/" + (string)i, m_meshState[i], m_meshTable[i]));
        output.Print("</td></tr>");
      }

      output.Print("</table>");
    }


    output.Print("</body></html>");
    return output.AsString();
  }


  void Refresh()
  {
    m_browser.LoadHTMLString(m_asset, GetHTML());
    m_browser.SetWindowSize(400, 600);
  	m_browser.SetWindowVisible(true);
    m_browser.ResizeHeightToFit();
    me.Sniff(m_browser, "Browser-URL", "", true);

    // UpdateResults();
  }




};