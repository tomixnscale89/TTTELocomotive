include "gs.gs"
include "asset.gs"
include "browser.gs"
include "trainzassetsearch.gs"

// ============================================================================
// Name: AssetBrowser
// Desc: Custom asset browser UI.
// ============================================================================
class AssetBrowser isclass GameObject
{
  Asset m_asset;
  GameObject m_parent;
  Browser m_browser;
  string m_categoryFilter;
  string m_searchFilter;
  string m_callbackMessage;
  Asset[] m_assetList;
  Asset m_selectedAsset;

  bool m_bSearchComplete;
  bool m_bSearchFailed;
  bool m_bIsOpen;
  int m_updateToken;
  AsyncTrainzAssetSearchObject m_search;

  void UpdateResults();
  void Refresh();
  void DoSearch();
  thread void SearchThread();

  public Asset GetSelectedAsset() { return m_selectedAsset; }

  public void Init(Asset asset, GameObject parent, string callbackMessage)
  {
    m_asset = asset;
    m_parent = parent;
    m_callbackMessage = callbackMessage;

    m_browser = Constructors.NewBrowser();
    m_bIsOpen = true;
    m_bSearchComplete = false;
    m_bSearchFailed = false;
    m_searchFilter = "";
    m_categoryFilter = "";
    m_search = null;
    m_updateToken = 0;
    m_selectedAsset = null;

    AddHandler(me, "Browser-URL", "", "OnBrowserURL");
    AddHandler(me, "TrainzAssetSearch", "Failure", "OnSearchFailed");
    AddHandler(me, "TrainzAssetSearch", "AsyncResult", "OnSearchResult");

    Refresh();
    DoSearch();
    SearchThread();
  }

  public void Close()
  {
    m_browser = null;
    m_search = null;
    m_bIsOpen = false;
  }

  bool IsUpdateCancelled(int token)
  {
    return m_updateToken > token;
  }

  void DoSearch()
  {
    int[] types = new int[1];
    string[] vals = new string[1];
    int iFilter = 0;
    types[iFilter] = TrainzAssetSearch.FILTER_LOCATION; vals[iFilter] = "local";
    iFilter++;

    if (m_searchFilter != "")
    {
      types[iFilter] = TrainzAssetSearch.FILTER_AND; // vals[iFilter] = "";
      iFilter++;
      types[iFilter] = TrainzAssetSearch.FILTER_KEYWORD; vals[iFilter] = m_searchFilter;
      iFilter++;
    }

    if (m_categoryFilter != "")
    {
      types[iFilter] = TrainzAssetSearch.FILTER_AND; // vals[iFilter] = "";
      iFilter++;
      types[iFilter] = TrainzAssetSearch.FILTER_CATEGORY; vals[iFilter] = m_categoryFilter;
      iFilter++;
    }

    m_bSearchComplete = false;
    m_bSearchFailed = false;
    m_search = TrainzAssetSearch.NewAsyncSearchObject();
    me.Sniff(m_search, "TrainzAssetSearch", "", true);

    TrainzAssetSearch.AsyncSearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true, m_search);
  }

  void OnSearchFailed(Message msg)
  {
    if (!msg or msg.dst != m_search or !m_bIsOpen)
      return;
    
    m_bSearchComplete = true;
    m_bSearchFailed = true;
    UpdateResults();
  }

  void OnSearchResult(Message msg)
  {
    if (!msg or msg.dst != m_search or !m_bIsOpen)
      return;
    
    m_bSearchComplete = true;
    m_bSearchFailed = false;
    UpdateResults();
  }

  void OnBrowserURL(Message msg)
  {
    if (!m_browser or msg.src != m_browser or !m_bIsOpen)
      return;

    if (msg.minor == "live://browse_loco")
    {
      m_categoryFilter = "TR;TV";
      DoSearch();
    }
    else if (msg.minor == "live://browse_scenery")
    {
      m_categoryFilter = "SY";
      DoSearch();
    }
    else if (msg.minor == "live://browse_mesh")
    {
      m_categoryFilter = "MESH";
      DoSearch();
    }
    else if (msg.minor == "live://browse_all")
    {
      m_categoryFilter = "";
      DoSearch();
    }
    else if(TrainUtil.HasPrefix(msg.minor, "live://select/"))
    {
      string command = msg.minor["live://select/".size(),];
      if(m_assetList and command)
      {
        m_selectedAsset = m_assetList[Str.ToInt(command)];
        PostMessage(m_parent, m_callbackMessage, "AssetBrowserSelect", 0.0);
      }
    }
  }

  string GetHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    output.Print("<table width=392 cellspacing=2 cellpadding=2>");
    
    output.Print("<tr><td>");
    output.Print("<a href='live://browse_loco'>Loco</a>");
    output.Print("<a href='live://browse_scenery'>Scenery</a>");
    output.Print("<a href='live://browse_mesh'>Mesh</a>");
    output.Print("<a href='live://browse_all'>All</a>");
    output.Print("</td></tr>");

    // output.Print("<br>");
    
    output.Print("<tr><td>");
    output.Print("<trainz-object style=edit-box link-on-focus-loss id=search text='" + BrowserInterface.Quote(m_searchFilter) + "' width=100% height=16></trainz-object>");
    output.Print("</td></tr>");

    // height=100%

    output.Print("<tr><td width=100%>");
    output.Print("<trainz-object style=browser id='results' width=100% height=512></trainz-object>");
    output.Print("</td></tr>");

    output.Print("</table>");

    output.Print("</body></html>");
    return output.AsString();
  }
  
  string GetResultsHTML(int token)
  {
    if (!m_search)
      return "";
    
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    
    if (!m_bSearchComplete)
    {
      output.Print("Loading...");
    }
    else if (m_bSearchFailed)
    {
      output.Print("Search failed!");
      output.Print("<br>");
      output.Print("<a href='live://refresh'>Retry</a>");
    }
    else
    {
      GameObject callingThread = Router.GetCurrentThreadGameObject();

      output.Print("<table>");
      // output.Print("<tr> <td width='300'></td> </tr>");
      output.Print("<tr> <td></td> <td></td> </tr>");
      m_assetList = m_search.GetResults();
      int iAsset;

      bool rowParity = false;
      string rowcolor;
      for (iAsset = 0; iAsset < m_assetList.size(); ++iAsset)
      {
        Asset asset = m_assetList[iAsset];

        if (rowParity) rowcolor = "#0E2A35"; else rowcolor = "#05171E";
        rowParity = !rowParity;
        output.Print("<tr bgcolor=" + rowcolor + ">");
        
        output.Print("<td>");
        output.Print("<a href='live://select/" + (string)iAsset + "'>" + asset.GetLocalisedName() + "</a>");
        output.Print("</td>");
        
        output.Print("<td align='right'>");
        output.Print("<trainz-object width=100 height=100 style=thumbnail-downloader asset='" + asset.GetKUID().GetLogString() + "'></trainz-object>");
        output.Print("</td>");

        
        output.Print("</tr>");

        // Yield so we don't timeout.
        if ((iAsset % 256) == 0)
          callingThread.Sleep(0.0);

        if (IsUpdateCancelled(token))
          return "";
      }
      output.Print("</table>");
    }


    output.Print("</body></html>");
    return output.AsString();
  }

  thread void UpdateResultsInternal(int token)
  {
    string html = GetResultsHTML(token);
    if (IsUpdateCancelled(token))
      return;
    
    m_browser.SetElementProperty("results", "html", html);
  }

  void UpdateResults()
  {
    UpdateResultsInternal(++m_updateToken);
  }

  thread void SearchThread()
  {
    // Browser origBrowser = m_browser;
    // m_browser == origBrowser and 
    while (m_bIsOpen and m_browser)
    {
      string search = m_browser.GetElementProperty("search", "text");
      if (search != m_searchFilter)
      {
        m_searchFilter = search;
        TrainzScript.Log("updating search " + m_searchFilter);
        // UpdateResults();
        DoSearch();
      }
      Sleep(0.1);
    }
  }

  void Refresh()
  {
    m_browser.LoadHTMLString(m_asset, GetHTML());
    m_browser.SetWindowSize(400, 600);
  	m_browser.SetWindowVisible(true);
    m_browser.ResizeHeightToFit();
    me.Sniff(m_browser, "Browser-URL", "", true);

    UpdateResults();
  }




};