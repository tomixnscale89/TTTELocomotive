include "gs.gs"
include "Browser.gs"
include "OnlineGroup.gs"
include "OnlineAccess.gs"

class CellBlock
{
  bool[] m_grid;
  int m_width;
  int m_height;
  int m_color;

  public void Init(int width, int height, int color)
  {
    m_width = width;
    m_height = height;
    m_color = color;
    m_grid = new bool[width * height];
  }

  public void Set(int x, int y)
  {
    m_grid[y * m_width + x] = true;
  }

  public bool Get(int x, int y)
  {
    return m_grid[y * m_width + x];
  }

  // perform a clockwise rotation n times.
  // not particularly efficient, but these are cached out so it's not a problem.
  public void Rotate(int n)
  {
    // Only supported on square shapes.
    if (m_width != m_height)
      return;
    
    int rot;
    
    for (rot = 0; rot < n; rot++)
    {
      bool[] newGrid = new bool[m_width * m_height];

      int x, y;
      for (y = 0; y < m_height; y++)
      {
        for (x = 0; x < m_width; x++)
        {
          if (m_grid[y * m_width + x])
          {
            newGrid[x * m_width + (m_height - y - 1)] = true;
          }
        }
      }
  
      m_grid = newGrid;
    }
  }

  public int GetWidth() { return m_width; }
  public int GetHeight() { return m_height; }
  public int GetColor() { return m_color; }
};

class TetrisGame isclass GameObject
{
  int m_uiScale = 2;
  int m_cellSize;
  bool m_bRunning = false;
  float m_fallSpeed;
  float m_fallTime;
  int m_score;
  int m_level;
  int m_nextLevelScore;
  float m_overlaySize;
  Browser m_window;
  Browser m_background;
  Browser m_scoreDisplay;
  Browser m_holdWindow;
  Browser m_queueWindow;
  Browser m_overlayWindow;
  Browser m_leaderboardWindow;
  Asset m_asset;
  OnlineGroup m_leaderboardGroup;
  // string[] m_leaderboardPlayers;
  Soup m_leaderboardScores;

  define int NUM_ROWS = 20;
  define int NUM_COLS = 10;
  define int NUM_QUEUED = 4;

  define int COL_NUL = 0;
  define int COL_RED = 0xFF0000;
  define int COL_ORG = 0xFFA500;
  define int COL_YLW = 0xFFFF00;
  define int COL_GRN = 0x00FF00;
  define int COL_BLU = 0x0000FF;
  define int COL_CYN = 0x00FFFF;
  define int COL_MGA = 0xFF00FF;
  define int COL_WHT = 0xFFFFFF;

  define int PC_I = 0;
  define int PC_J = 1;
  define int PC_L = 2;
  define int PC_O = 3;
  define int PC_S = 4;
  define int PC_T = 5;
  define int PC_Z = 6;

  // Key inputs.
  bool m_bRotateLeft;   // Z
  bool m_bRotateRight;  // UpArrow, X
  bool m_bMoveLeft;     // LeftArrow
  bool m_bMoveRight;    // RightArrow
  bool m_bMoveDown;     // DownArrow
  bool m_bDrop;         // Space
  bool m_bHold;         // C
  bool m_bCanHold;

  // Current piece type.
  int m_curPiece;
  int m_heldPiece;
  int[] m_queuedPieces = new int[NUM_QUEUED];
  // Clockwise rotation index.
  int m_curX;
  int m_curY;
  int m_curRotation;
  float m_timeSinceLastMove;
  float m_soundTime;
  bool m_bIsPieceAboutToPlace;
  int[] m_cellGrid;
  
  int GetCell(int x, int y)
  {
    if (x < 0 or x >= NUM_COLS or y >= NUM_ROWS)
      return COL_WHT;
    
    // Treat cells over the top as empty.
    if (y < 0)
      return COL_NUL;
    
    return m_cellGrid[y * NUM_COLS + x];
  }

  void SetCell(int x, int y, int value)
  {
    if (x < 0 or x >= NUM_COLS or y < 0 or y >= NUM_ROWS)
      return;

    m_cellGrid[y * NUM_COLS + x] = value;
  }

  int DarkenColor(int color)
  {
    int r = (color >> 16) & 0xFF;
    int g = (color >> 8) & 0xFF;
    int b = color & 0xFF;

    r = (int)(r * 0.5);
    g = (int)(g * 0.5);
    b = (int)(b * 0.5);

    return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
  }

  string GetHexString(int x)
  {
    string str = "000000";

    int i;
    for (i = 5; i >= 0; --i)
    {
      int value = (x & 0xF);
      x = x >> 4;

      switch (value)
      {
      default:
      case 0x0: str[i] = '0'; break;
      case 0x1: str[i] = '1'; break;
      case 0x2: str[i] = '2'; break;
      case 0x3: str[i] = '3'; break;
      case 0x4: str[i] = '4'; break;
      case 0x5: str[i] = '5'; break;
      case 0x6: str[i] = '6'; break;
      case 0x7: str[i] = '7'; break;
      case 0x8: str[i] = '8'; break;
      case 0x9: str[i] = '9'; break;
      case 0xA: str[i] = 'A'; break;
      case 0xB: str[i] = 'B'; break;
      case 0xC: str[i] = 'C'; break;
      case 0xD: str[i] = 'D'; break;
      case 0xE: str[i] = 'E'; break;
      case 0xF: str[i] = 'F'; break;
      }
    }

    return str;
    // return str[0, 6];
  }

  void ResetKeyState()
  {
    m_bRotateLeft = false;
    m_bRotateRight = false;
    m_bMoveLeft = false;
    m_bMoveRight = false;
    m_bMoveDown = false;
    m_bDrop = false;
    m_bHold = false;
  }

  public void StartGame(Asset asset, GameObject parent, OnlineGroup leaderboard);
  void HandleKey(string key);
  string GetBackgroundHTML();
  string GetDisplayHTML();
  void UpdateDisplay();
  // public void UpdateLeaderboardUsers();
  public void UpdateLeaderboard();
  thread void GameLoop();
  void ChooseNewPiece();
  void SoundThink(float dt);
  void GameThink(float dt);
  void ScoreThink();
  void DetachPiece();
  void AttachPiece();
  bool CanFitPieceAt(int x, int y, int piece, int rot);
  bool MovePieceDown();
  bool MovePieceLeft();
  bool MovePieceRight();
  bool RotatePieceLeft();
  bool RotatePieceRight();
  void DropPiece();
  void HoldPiece();
  void InitPieceTable();
  CellBlock GetPiece(int piece, int rot);
  
  // ============================================================================
  // Public interface
  // ============================================================================

  // Call this with the library asset.
  public void StartGame(Asset asset, GameObject parent, OnlineGroup leaderboard)
  {
    TrainzScript.Log("Start game");

    m_cellGrid = new int[NUM_ROWS * NUM_COLS];
    ResetKeyState();
    InitPieceTable();

    m_uiScale = 2;

    m_asset = asset;
    m_background = Constructors.NewBrowser();
    m_scoreDisplay = Constructors.NewBrowser();
    m_holdWindow = Constructors.NewBrowser();
    m_queueWindow = Constructors.NewBrowser();
    m_window = Constructors.NewBrowser();
    m_overlayWindow = Constructors.NewBrowser();

    // Reset all parameters.
    m_fallSpeed = 1.0;
    m_fallTime = 0.0;
    m_timeSinceLastMove = 0.0;
    m_soundTime = 1000000.0; // force start music loop
    m_bIsPieceAboutToPlace = false;
    m_curPiece = -1;
    m_heldPiece = -1;
    m_curX = 0;
    m_curY = 0;
    m_curRotation = 0;
    m_overlaySize = 1.0;
    m_bCanHold = true;

    int i;
    for (i = 0; i < NUM_QUEUED; i++)
      m_queuedPieces[i] = Math.Rand(0, 7);

    m_score = 0;
    m_level = 1;
    m_nextLevelScore = 1500;
    m_bRunning = true;
    
    UpdateDisplay();
    m_window.SetWindowVisible(true);
    m_window.SetMovableByDraggingBackground(false);
    m_window.SetWindowStyle(Browser.STYLE_POPOVER);

    m_background.SetWindowStyle(Browser.STYLE_NO_FRAME);
    m_background.SetMovableByDraggingBackground(false);
    m_background.SetWindowVisible(true);

    m_scoreDisplay.SetWindowStyle(Browser.STYLE_NO_FRAME);
    m_scoreDisplay.SetMovableByDraggingBackground(false);
    m_scoreDisplay.SetWindowVisible(true);

    m_holdWindow.SetWindowStyle(Browser.STYLE_NO_FRAME);
    m_holdWindow.SetMovableByDraggingBackground(false);
    m_holdWindow.SetWindowVisible(true);

    m_queueWindow.SetWindowStyle(Browser.STYLE_NO_FRAME);
    m_queueWindow.SetMovableByDraggingBackground(false);
    m_queueWindow.SetWindowVisible(true);

    m_overlayWindow.SetWindowStyle(Browser.STYLE_NO_FRAME);
    m_overlayWindow.SetMovableByDraggingBackground(false);
    m_overlayWindow.SetWindowVisible(false);

    ChooseNewPiece();

    // Quiet things down.
    Interface.SetMapView(true);
    World.SetCameraFlags(World.GetCameraFlags() | World.CAMERA_LOCKED);


    // m_leaderboardPlayers = new string[0];
    m_leaderboardScores = Constructors.NewSoup();
    m_leaderboardGroup = leaderboard;
    // UpdateLeaderboardUsers();
    UpdateLeaderboard();

    if (m_leaderboardGroup)
    {
      m_leaderboardWindow = Constructors.NewBrowser();
      m_leaderboardWindow.SetWindowStyle(Browser.STYLE_NO_FRAME);
      m_leaderboardWindow.SetMovableByDraggingBackground(false);
      m_leaderboardWindow.SetWindowVisible(true);
    }

    // Handlers
    AddHandler(parent, "ControlSet", "", "HandleSelect");

    if (m_leaderboardGroup)
    {  
      AddHandler(m_leaderboardGroup, "OnlineGroup", "UsersChange", "LeaderboardChangeHandler");
      AddHandler(m_leaderboardGroup, "OnlineGroup", "ReceiveMessage", "LeaderboardUpdateHandler");
    }

    GameLoop();
  }

  // Selection menu handler.
  void HandleSelect(Message msg)
  {
    if (!m_bRunning)
      return;
    
    HandleKey(msg.minor);
  }

  void LeaderboardChangeHandler(Message msg)
  {
    if (!m_bRunning)
      return;

    // UpdateLeaderboardUsers();
  }

  void LeaderboardUpdateHandler(Message msg)
  {
    if (!m_bRunning)
      return;

    UpdateLeaderboard();
  }

  void HandleKey(string key)
  {
    if (key == "rotate-left")
      m_bRotateLeft = true;
    else if (key == "rotate-right")
      m_bRotateRight = true;
    else if (key == "move-down")
      m_bMoveDown = true;
    else if (key == "move-left")
      m_bMoveLeft = true;
    else if (key == "move-right")
      m_bMoveRight = true;
    else if (key == "drop")
      m_bDrop = true;
    else if (key == "hold")
      m_bHold = true;
  }

  // ============================================================================
  // Display functionality
  // ============================================================================
  string GetBackgroundHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<table><tr bgcolor=#000000 height=" + (string)Interface.GetDisplayHeight() + "><td width=" + (string)Interface.GetDisplayWidth() + "></td></tr></table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetScoreHTML(int width, int fontSize)
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<table>");

    output.Print("<tr bgcolor=#00000000><td width=" + (string)width + ">");
    output.Print("<font size=" + (string)fontSize + " color=#FFFFFF>" + (string)m_score + "</font>");
    output.Print("</td></tr>");

    output.Print("<tr bgcolor=#00000000><td width=" + (string)width + ">");
    output.Print("<font size=" + (string)fontSize + " color=#FFFFFF>Level " + (string)m_level + "</font>");
    output.Print("</td></tr>");
    
    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  void DrawBlock(int cellSize, CellBlock block, HTMLBuffer output)
  {
    string colorStr = GetHexString(block.GetColor());

    // Tiny cell grid.
    output.Print("<table cellpadding=0 cellspacing=0 border=8>");
    int row, col;
    for (row = 0; row < block.GetHeight(); row++)
    {
      output.Print("<tr height=" + (string)cellSize + ">");
      for (col = 0; col < block.GetWidth(); col++)
      {
        output.Print("<td width=" + (string)cellSize + ">");
        bool cell = block.Get(col, row);
        if (cell)
        {
          // TrainzScript.Log("cell color " + (string)cell + " is " + GetHexString(cell));
          output.Print("<img src='block.png' color=#" + colorStr + " width=" + (string)cellSize + " height=" + (string)cellSize + ">");
        }
        else
        {
          // Nothing.
          // output.Print("<img src='easteregg/slot.png' width=" + (string)cellSize + " height=" + (string)cellSize + ">");
        }
        output.Print("</td>");
      }
      output.Print("</tr>");
    }
    output.Print("</table>");
  }

  string GetHoldHTML(int width, int height)
  {
    CellBlock block = GetPiece(m_heldPiece, 0);

    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");

    output.Print("<table cellpadding=8>");
    output.Print("<tr align='center' valign='center' height=" + (string)height + "><td width=" + (string)width + " bgcolor=#131D4F>");
    if (block)
    {
      DrawBlock(m_cellSize / 2, block, output);
    }
    output.Print("</td></tr>");
    output.Print("</table>");

  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetQueueHTML(int width)
  {
    CellBlock block = GetPiece(m_heldPiece, 0);

    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<table cellpadding=8 cellspacing=8>");

    int i;
    for (i = 0; i < NUM_QUEUED; i++)
    {
      int blockSize = (m_cellSize / 2) * 4 + 16;
      
      output.Print("<tr align='center' valign='center' height=" + (string)blockSize + "><td width=" + (string)blockSize + " bgcolor=#131D4F>");
      CellBlock block = GetPiece(m_queuedPieces[i], 0);
      if (block)
      {
        DrawBlock(m_cellSize / 2, block, output);
      }
      output.Print("</td></tr>");
    }

    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetDisplayHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    // Hold box.

    // Game canvas.
    output.Print("<table cellpadding=0 cellspacing=0>");
    int row, col;
    for (row = 0; row < NUM_ROWS; row++)
    {
      output.Print("<tr height=" + (string)m_cellSize + ">");
      for (col = 0; col < NUM_COLS; col++)
      {
        output.Print("<td width=" + (string)m_cellSize + ">");
        int cell = GetCell(col, row);
        if (cell != 0)
        {
          // TrainzScript.Log("cell color " + (string)cell + " is " + GetHexString(cell));
          output.Print("<img src='block.png' color=#" + GetHexString(cell) + " width=" + (string)m_cellSize + " height=" + (string)m_cellSize + ">");
        }
        else
        {
          output.Print("<img src='slot.png' width=" + (string)m_cellSize + " height=" + (string)m_cellSize + ">");
        }
        output.Print("</td>");
      }
      output.Print("</tr>");
    }
    output.Print("</table>");

    // Upcoming list.
    
    output.Print("</body></html>");
    return output.AsString();
  }

  string GetOverlayHTML(int width, int height)
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");

    output.Print("<table cellpadding=8>");
    output.Print("<tr align='center' valign='center' height=" + (string)height + "><td width=" + (string)width + ">");
    output.Print("<img src='levelup.png' width=" + (string)width + " height=" + (string)height + ">");
    output.Print("</td></tr>");
    output.Print("</table>");

  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetLeaderboardHTML(int width)
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");

    output.Print("<table cellspacing=2 width=" + (string)width + ">");
    output.Print("<tr height=32><td>Leaderboard</td><td>Score</td></tr>");

    // if (m_leaderboardPlayers.size())
    {
      int i;
      int j;

      string[] names = new string[m_leaderboardScores.CountTags()];
      int[] scores = new int[m_leaderboardScores.CountTags()];
      for (i = 0; i < m_leaderboardScores.CountTags(); i++)
      {
        names[i] = m_leaderboardScores.GetIndexedTagName(i);
        scores[i] = m_leaderboardScores.GetNamedTagAsInt(names[i], 0);
      }

      names[names.size()] = World.GetLocalPlayerName();
      scores[scores.size()] = m_score;

      // Bubble sort scores and names.
      bool swap = false;
      for (i = 0; i < scores.size() - 1; i++)
      {
        swap = false;
        for (j = 0; j < scores.size() - i - 1; j++)
        {
          if (scores[j] < scores[j + 1])
          {
            string tmpName = names[j];
            int tmpScore = scores[j];
            names[j] = names[j + 1];
            scores[j] = scores[j + 1];
            names[j + 1] = tmpName;
            scores[j + 1] = tmpScore;
            swap = true;
          }
        }
        
        if (!swap)
          break;
      }
      
      bool rowParity = false;
      for (i = 0; i < scores.size(); i++)
      {
        rowParity = !rowParity;
        string rowcolor;
        if (rowParity)
          rowcolor = "#0E2A35";
        else
          rowcolor = "#05171E";

        output.Print("<tr height=24 bgcolor=" + rowcolor + ">");
        output.Print("<td>" + names[i] + "</td>");
        output.Print("<td>" + (string)scores[i] + "</td>");
        output.Print("</tr>");
      }
    }
    output.Print("</table>");

  	output.Print("</body></html>");

  	return output.AsString();
  }

  void UpdateDisplay()
  {
    m_cellSize = 24 * m_uiScale;

    int w = m_cellSize * NUM_COLS;
    int h = m_cellSize * NUM_ROWS;

    int windX = Interface.GetDisplayWidth() / 2 - w / 2;
    int windY = Interface.GetDisplayHeight() / 2 - h / 2;
    m_window.SetWindowPosition(windX, windY);
  	m_window.SetWindowSize(w, h);
    m_window.LoadHTMLString(m_asset, GetDisplayHTML());
    
    int margin = 32;

    m_background.SetWindowPosition(0, 0);
    m_background.SetWindowSize(Interface.GetDisplayWidth(), Interface.GetDisplayHeight());
    m_background.LoadHTMLString(m_asset, GetBackgroundHTML());

    int holdSize = (m_cellSize / 2) * 4 + 16;
    int holdX = windX - holdSize - margin;
    m_holdWindow.SetWindowPosition(holdX, windY);
    m_holdWindow.SetWindowSize(holdSize, holdSize);
    m_holdWindow.LoadHTMLString(m_asset, GetHoldHTML(holdSize, holdSize));

    m_scoreDisplay.SetWindowPosition(holdX - 128 - margin, windY);
    m_scoreDisplay.SetWindowSize(128, 32);
    m_scoreDisplay.LoadHTMLString(m_asset, GetScoreHTML(128, 18));
    m_scoreDisplay.ResizeHeightToFit();

    int queueWidth = (m_cellSize / 2) * 4 + 16;
    m_queueWindow.SetWindowPosition(windX + w + margin, windY);
    m_queueWindow.SetWindowSize(queueWidth, queueWidth);
    m_queueWindow.LoadHTMLString(m_asset, GetQueueHTML(queueWidth));
    m_queueWindow.ResizeHeightToFit();

    int overlayW = 128 * m_overlaySize;
    int overlayH = 64 * m_overlaySize;
    if (m_overlayWindow.GetWindowVisible())
    {
      m_overlaySize = m_overlaySize - 0.2;
      if (m_overlaySize <= 0)
      {
        m_overlayWindow.SetWindowVisible(false);
      }
      else
      {
        m_overlayWindow.SetWindowPosition(Interface.GetDisplayWidth() / 2 - overlayW / 2, Interface.GetDisplayHeight() / 2 - overlayH / 2);
        m_overlayWindow.SetWindowSize(overlayW, overlayH);
        m_overlayWindow.LoadHTMLString(m_asset, GetOverlayHTML(overlayW, overlayH));
      }
    }

    m_scoreDisplay.BringToFront();
    m_holdWindow.BringToFront();
    m_queueWindow.BringToFront();
    m_window.BringToFront();

    if (m_leaderboardWindow)
    {
      int leaderboardY = windY + holdSize + margin;
      int leaderboardSize = holdSize + 64;
      m_leaderboardWindow.SetWindowPosition(holdX - 64, leaderboardY);
      m_leaderboardWindow.SetWindowSize(leaderboardSize, holdSize);
      m_leaderboardWindow.LoadHTMLString(m_asset, GetLeaderboardHTML(leaderboardSize));
      m_leaderboardWindow.ResizeHeightToFit();
      m_leaderboardWindow.BringToFront();
    }

    m_overlayWindow.BringToFront();
  }

  public OnlineGroup GetLeaderboardGroup() { return m_leaderboardGroup; }

  // public void UpdateLeaderboardUsers()
  // {
  //   if (!m_leaderboardGroup)
  //     return;
    
  //   // Update the users list.
  //   m_leaderboardPlayers = new string[0];

  //   TrainzScript.Log((string)m_leaderboardGroup.CountUsers() + " leaderboard users!");
  //   int i;
  //   for (i = 0; i < m_leaderboardGroup.CountUsers(); i++)
  //   {
  //     TrainzScript.Log(m_leaderboardGroup.GetIndexedUser(i));
  //     m_leaderboardPlayers[m_leaderboardPlayers.size()] = m_leaderboardGroup.GetIndexedUser(i);
  //   }
  // }

  bool CollectLeaderboardMessage()
  {
    string sourceUser = "";
    Soup data = Constructors.NewSoup();
    int result = m_leaderboardGroup.CollectMessage(sourceUser, data);
    if (result != OnlineAccess.RESULT_OK or sourceUser == "")
      return false;

    TrainzScript.Log("Received leaderboard message from " + sourceUser + ", score=" + (string)data.GetNamedTagAsInt("score", -1));
    
    m_leaderboardScores.SetNamedTag(sourceUser, data.GetNamedTagAsInt("score", 0));
    return true;
  }

  public void UpdateLeaderboard()
  {
    if (!m_leaderboardGroup)
      return;

      int nMessagesReceived = 100;
      while (--nMessagesReceived)
      {
        if (!CollectLeaderboardMessage())
          break;
      }
  }

  public void BroadcastLeaderboardScore()
  {
    if (!m_leaderboardGroup)
      return;
    
    Soup data = Constructors.NewSoup();
    data.SetNamedTag("score", m_score);
    data.SetNamedTag("level", m_level);
    m_leaderboardGroup.PostMessage(data);
  }
  
  // ============================================================================
  // Game functionality
  // ============================================================================

  thread void GameLoop()
  {
    if (!m_window or !m_bRunning)
    {
      return;
    }

    float timestep = 0.05;
    while (m_window and m_bRunning)
    {
      SoundThink(timestep);
      GameThink(timestep);

      // If we lost, early out.
      if (!m_bRunning)
        return;

      // UpdateLeaderboardUsers();
      UpdateLeaderboard();

      ResetKeyState();
      UpdateDisplay();
      Sleep(timestep);
    }

  }

  void GameOver()
  {
    World.SetCameraFlags(World.GetCameraFlags() & ~World.CAMERA_LOCKED);
    Interface.SetMapView(false);
    m_window = null;
    m_holdWindow = null;
    m_queueWindow = null;
    m_scoreDisplay = null;
    m_background = null;
    m_overlayWindow = null;

    m_leaderboardGroup = null;
    m_leaderboardWindow = null;

    m_bRunning = false;
  }

  void ChooseNewPiece()
  {
    m_timeSinceLastMove = 0;
    m_fallTime = 0;
    m_bCanHold = true;

    // Dequeue a piece.
    int piece = m_queuedPieces[0];

    int i;
    for (i = 0; i < NUM_QUEUED - 1; i++)
      m_queuedPieces[i] = m_queuedPieces[i + 1];
    m_queuedPieces[NUM_QUEUED - 1] = Math.Rand(0, 7);

    m_curPiece = piece;
    m_curRotation = 0;

    CellBlock block = GetPiece(piece, 0);
    m_curX = (NUM_COLS / 2) - (block.GetWidth() / 2);
    m_curY = -1;

    if (!CanFitPieceAt(m_curX, m_curY, m_curPiece, m_curRotation))
    {
      GameOver();
    }
  }

  void IncrementLevel()
  {
    m_level++;
    m_nextLevelScore = m_nextLevelScore + 2000;

    
    if (m_fallSpeed > 0.25)
    {
      m_fallSpeed = m_fallSpeed - 0.2;
    }
    else
    {
      // Get progressively more impossible after level 5.

      m_fallSpeed = m_fallSpeed * 0.5;
    }

    m_overlayWindow.SetWindowVisible(true);
    m_overlaySize = 6.0;
  }

  void SoundThink(float dt)
  {
    m_soundTime = m_soundTime + dt;

    // Make sure the music is able to loop.
    // Keep this updated to match the audio file duration.
    if (m_soundTime >= 137.143)
    {
      m_soundTime = 0;
      TrainzScript.Log("Playing game loop");
      World.PlaySound(m_asset, "music_loop.wav", 1000.0, 1.0, 1000.0, null, null);
    }
  }

  void GameThink(float dt)
  {
    if (m_score >= m_nextLevelScore)
    {
      // Next level.
      IncrementLevel();
    }

    // At the beginning of the frame, always detach the piece from the board.
    DetachPiece();

    m_bIsPieceAboutToPlace = false;

    m_timeSinceLastMove = m_timeSinceLastMove + dt;
    // Process input.
    if (m_bRotateLeft)
    {
      if (RotatePieceLeft())
        m_timeSinceLastMove = 0;
    }
    else if (m_bRotateRight)
    {
      if (RotatePieceRight())
        m_timeSinceLastMove = 0;
    }
    else if (m_bMoveLeft)
    {
      if (MovePieceLeft())
        m_timeSinceLastMove = 0;
    }
    else if (m_bMoveRight)
    {
      if (MovePieceRight())
        m_timeSinceLastMove = 0;
    }
    else if (m_bMoveDown)
    {
      if (MovePieceDown())
        m_timeSinceLastMove = 0;
    }
    else if (m_bDrop)
    {
      // Drop it and attach it.
      DropPiece();
      AttachPiece();
      ChooseNewPiece();

      // If we lost, early out.
      if (!m_bRunning)
        return;
    }
    else if (m_bHold and m_bCanHold)
    {
      HoldPiece();
      m_bCanHold = false;

      // If we lost, early out.
      if (!m_bRunning)
        return;
    }

    // Did our piece fall?
    m_fallTime = m_fallTime + dt;
    while (m_fallTime > m_fallSpeed)
    {
      m_fallTime = m_fallTime - m_fallSpeed;
      if (MovePieceDown())
        m_timeSinceLastMove = 0;
    }

    // Place the block if we can't move down anymore.
    if (!CanFitPieceAt(m_curX, m_curY + 1, m_curPiece, m_curRotation))
    {
      if (m_timeSinceLastMove > 0.5)
      {
        AttachPiece();
        ChooseNewPiece();

        // If we lost, early out.
        if (!m_bRunning)
          return;
      }
      else
      {
        m_bIsPieceAboutToPlace = true;
      }
    }

    // Clear any full lines and add up the score!
    ScoreThink();

    // Reattach the current piece to the display at the end of the frame.
    AttachPiece();
  }

  void CollapseRowsAbove(int n)
  {
    // Shift rows above n downward, in place.
    int row;
    int col;
    for (row = n; row >= 0; --row)
    {
      for (col = 0; col < NUM_COLS; col++)
      {
        SetCell(col, row, GetCell(col, row - 1));
      }
    }
  }

  void ScoreThink()
  {
    int numCollapsed = 0;

    // Clear any filled rows.
    int row;
    int col;
    for (row = NUM_ROWS - 1; row >= 0;)
    {
      bool filled = true;
      for (col = 0; col < NUM_COLS; col++)
      {
        if (!GetCell(col, row))
        {
          filled = false;
          break;
        }
      }

      if (filled)
      {
        CollapseRowsAbove(row);
        numCollapsed++;
      }
      else
      {
        --row;
      }
    }

    m_score = m_score + numCollapsed * 100;
    BroadcastLeaderboardScore();
  }

  // ============================================================================
  // Movement
  // ============================================================================
  void DetachPiece()
  {
    CellBlock piece = GetPiece(m_curPiece, m_curRotation);

    int local_x, local_y;
    for (local_y = 0; local_y < piece.GetHeight(); local_y++)
    {
      for (local_x = 0; local_x < piece.GetWidth(); local_x++)
      {
        if (piece.Get(local_x, local_y))
          SetCell(m_curX + local_x, m_curY + local_y, COL_NUL);
      }
    }
  }

  void AttachPiece()
  {
    CellBlock piece = GetPiece(m_curPiece, m_curRotation);

    int color = piece.GetColor();
    if (m_bIsPieceAboutToPlace)
    {
      color = DarkenColor(color);
    }

    int local_x, local_y;
    for (local_y = 0; local_y < piece.GetHeight(); local_y++)
    {
      for (local_x = 0; local_x < piece.GetWidth(); local_x++)
      {
        if (piece.Get(local_x, local_y))
          SetCell(m_curX + local_x, m_curY + local_y, color);
      }
    }
  }

  bool CanFitPieceAt(int x, int y, int piece, int rot)
  {
    CellBlock data = GetPiece(piece, rot);

    int local_x, local_y;
    for (local_y = 0; local_y < data.GetHeight(); local_y++)
    {
      for (local_x = 0; local_x < data.GetWidth(); local_x++)
      {
        if (data.Get(local_x, local_y) and GetCell(x + local_x, y + local_y) != 0)
          return false;
      }
    }

    return true;
  }

  bool CheckPiece(int rot, int x_offset, int y_offset)
  {
    // flip y offset.
    y_offset = y_offset * -1;

    if (CanFitPieceAt(m_curX + x_offset, m_curY + y_offset, m_curPiece, rot))
    {
      m_curX = m_curX + x_offset;
      m_curY = m_curY + y_offset;
      m_curRotation = rot;
      return true;
    }
    return false;
  }

  // Attempt to set the piece rotation to the desired state.
  bool SetPieceRotation(int rot)
  {
    if (m_curPiece == PC_O)
      return true;
    
    // check basic rotation.
    if (CheckPiece(rot, 0, 0))
      return true;

    // Test various rotation/wallkick states.
    // Hardcoded because this would be a PITA to cache out in TrainzScript syntax.
    if (m_curPiece == PC_J
      or m_curPiece == PC_L
      or m_curPiece == PC_T
      or m_curPiece == PC_S
      or m_curPiece == PC_Z)
    {
      if (m_curRotation == 0)
      {
        if (rot == 1)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, -1, 1)) return true;
          if (CheckPiece(rot, 0, -2)) return true;
          if (CheckPiece(rot, -1, -2)) return true;
        }
        else if (rot == 3)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, 1, 1)) return true;
          if (CheckPiece(rot, 0, -2)) return true;
          if (CheckPiece(rot, 1, -2)) return true;
        }
      }
      else if (m_curRotation == 1)
      {
        if (rot == 0)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, 1, -1)) return true;
          if (CheckPiece(rot, 0, 2)) return true;
          if (CheckPiece(rot, 1, 2)) return true;
        }
        else if (rot == 2)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, 1, -1)) return true;
          if (CheckPiece(rot, 0, 2)) return true;
          if (CheckPiece(rot, 1, 2)) return true;
        }
      }
      else if (m_curRotation == 2)
      {
        if (rot == 1)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, -1, 1)) return true;
          if (CheckPiece(rot, 0, -2)) return true;
          if (CheckPiece(rot, -1, -2)) return true;
        }
        else if (rot == 3)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, 1, 1)) return true;
          if (CheckPiece(rot, 0, -2)) return true;
          if (CheckPiece(rot, 1, -2)) return true;
        }
      }
      else if (m_curRotation == 3)
      {
        if (rot == 0)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, -1, -1)) return true;
          if (CheckPiece(rot, 0, 2)) return true;
          if (CheckPiece(rot, -1, 2)) return true;
        }
        else if (rot == 2)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, -1, -1)) return true;
          if (CheckPiece(rot, 0, 2)) return true;
          if (CheckPiece(rot, -1, 2)) return true;
        }
      }
    }

    if (m_curPiece == PC_I)
    {
      if (m_curRotation == 0)
      {
        if (rot == 1)
        {
          if (CheckPiece(rot, -2, 0)) return true;
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, -2, -1)) return true;
          if (CheckPiece(rot, 1, 2)) return true;
        }
        else if (rot == 3)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, 2, 0)) return true;
          if (CheckPiece(rot, -1, 2)) return true;
          if (CheckPiece(rot, 2, -1)) return true;
        }
      }
      else if (m_curRotation == 1)
      {
        if (rot == 0)
        {
          if (CheckPiece(rot, 2, 0)) return true;
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, 2, 1)) return true;
          if (CheckPiece(rot, -1, -2)) return true;
        }
        else if (rot == 2)
        {
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, 2, 0)) return true;
          if (CheckPiece(rot, -1, 2)) return true;
          if (CheckPiece(rot, 2, -1)) return true;
        }
      }
      else if (m_curRotation == 2)
      {
        if (rot == 1)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, -2, 0)) return true;
          if (CheckPiece(rot, 1, -2)) return true;
          if (CheckPiece(rot, -2, 1)) return true;
        }
        else if (rot == 3)
        {
          if (CheckPiece(rot, 2, 0)) return true;
          if (CheckPiece(rot, -1, 0)) return true;
          if (CheckPiece(rot, 2, 1)) return true;
          if (CheckPiece(rot, -1, -2)) return true;
        }
      }
      else if (m_curRotation == 3)
      {
        if (rot == 0)
        {
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, -2, 0)) return true;
          if (CheckPiece(rot, 1, -2)) return true;
          if (CheckPiece(rot, -2, 1)) return true;
        }
        else if (rot == 2)
        {
          if (CheckPiece(rot, -2, 0)) return true;
          if (CheckPiece(rot, 1, 0)) return true;
          if (CheckPiece(rot, -2, -1)) return true;
          if (CheckPiece(rot, 1, 2)) return true;
        }
      }
    }

    return false;
  }

  bool MovePieceDown()
  {
    return CheckPiece(m_curRotation, 0, -1);
  }

  bool MovePieceLeft()
  {
    return CheckPiece(m_curRotation, -1, 0);
  }

  bool MovePieceRight()
  {
    return CheckPiece(m_curRotation, 1, 0);
  }

  bool RotatePieceLeft()
  {
    int rot = m_curRotation - 1;
    if (rot < 0) rot = 3;
    return SetPieceRotation(rot);
  }

  bool RotatePieceRight()
  {
    int rot = m_curRotation + 1;
    if (rot > 3) rot = 0;
    return SetPieceRotation(rot);
  }

  void DropPiece()
  {
    // Prevent infinite loop.
    int nDrop = NUM_ROWS;
    while (nDrop--)
    {
      if (!CheckPiece(m_curRotation, 0, -1))
        break;
    }
  }

  void HoldPiece()
  {
    int tmp = m_curPiece;
    m_curPiece = m_heldPiece;
    m_heldPiece = tmp;

    if (m_curPiece == -1)
    {
      ChooseNewPiece();
    }
    else
    {
      m_timeSinceLastMove = 0;
      m_fallTime = 0;
      m_curRotation = 0;
  
      CellBlock block = GetPiece(m_curPiece, 0);
      m_curX = (NUM_COLS / 2) - (block.GetWidth() / 2);
      m_curY = -1;
  
      if (!CanFitPieceAt(m_curX, m_curY, m_curPiece, m_curRotation))
      {
        GameOver();
      }
    }
  }

  // ============================================================================
  // Pieces
  // ============================================================================
  CellBlock[] m_pieceTable;

  CellBlock CreatePiece(int type)
  {
    // https://tetris.fandom.com/wiki/SRS
    CellBlock block = new CellBlock();
    if (type == PC_I)
    {
      block.Init(4, 4, COL_CYN);
      block.Set(0, 1);
      block.Set(1, 1);
      block.Set(2, 1);
      block.Set(3, 1);
    }
    else if (type == PC_J)
    {
      block.Init(3, 3, COL_BLU);
      block.Set(0, 0);
      block.Set(0, 1);
      block.Set(1, 1);
      block.Set(2, 1);
    }
    else if (type == PC_L)
    {
      block.Init(3, 3, COL_ORG);
      block.Set(2, 0);
      block.Set(0, 1);
      block.Set(1, 1);
      block.Set(2, 1);
    }
    else if (type == PC_O)
    {
      block.Init(4, 3, COL_YLW);
      block.Set(1, 0);
      block.Set(2, 0);
      block.Set(1, 1);
      block.Set(2, 1);
    }
    else if (type == PC_S)
    {
      block.Init(3, 3, COL_GRN);
      block.Set(1, 0);
      block.Set(2, 0);
      block.Set(0, 1);
      block.Set(1, 1);
    }
    else if (type == PC_T)
    {
      block.Init(3, 3, COL_MGA);
      block.Set(1, 0);
      block.Set(0, 1);
      block.Set(1, 1);
      block.Set(2, 1);
    }
    else if (type == PC_Z)
    {
      block.Init(3, 3, COL_RED);
      block.Set(0, 0);
      block.Set(1, 0);
      block.Set(1, 1);
      block.Set(2, 1);
    }
    else
    {
      return null;
    }

    return block;
  }


  void InitPieceTable()
  {
    m_pieceTable = new CellBlock[7 * 4];
    int pc, rot;
    for (pc = 0; pc < 7; pc++)
    {
      for (rot = 0; rot < 4; rot++)
      {
        CellBlock blk = CreatePiece(pc);

        // O piece has no rotation.
        if (pc != PC_O)
          blk.Rotate(rot);
        
        m_pieceTable[pc * 4 + rot] = blk;
      }
    }
  }

  CellBlock GetPiece(int piece, int rot)
  {
    if (piece < 0 or piece > 6 or rot < 0 or rot > 3)
      return null;
    
    return m_pieceTable[piece * 4 + rot];
  }

};