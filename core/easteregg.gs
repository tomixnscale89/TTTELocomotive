include "gs.gs"
include "Browser.gs"

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

class TetrisGame
{
  int m_uiScale = 1;
  bool m_bRunning = false;
  float m_fallSpeed;
  float m_fallTime;
  Browser m_window;
  Asset m_asset;

  define int NUM_ROWS = 20;
  define int NUM_COLS = 10;

  define int COL_NUL = 0;
  define int COL_RED = 0xFF0000FF;
  define int COL_ORG = 0xFFA500FF;
  define int COL_YLW = 0xFFFF00FF;
  define int COL_GRN = 0x00FF00FF;
  define int COL_BLU = 0x0000FFFF;
  define int COL_CYN = 0x00FFFFFF;
  define int COL_MGA = 0xFF00FFFF;
  define int COL_WHT = 0xFFFFFFFF;

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

  // Current piece type.
  int m_curPiece;
  // Clockwise rotation index.
  int m_curX;
  int m_curY;
  int m_curRotation;
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

  string GetHexString(int x)
  {
    string str = "00000000";

    int i;
    for (i = 7; i >= 0; --i)
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

  public void StartGame(Asset asset);
  string GetDisplayHTML();
  void UpdateDisplay();
  thread void GameLoop();
  void GameThink(float dt);
  void DetachPiece();
  void AttachPiece();
  bool CanFitPieceAt(int x, int y, int piece, int rot);
  bool MovePieceDown();
  void MovePieceLeft();
  void MovePieceRight();
  void RotatePieceLeft();
  void RotatePieceRight();
  void DropPiece();
  void InitPieceTable();
  CellBlock GetPiece(int piece, int rot);
  
  // ============================================================================
  // Public interface
  // ============================================================================

  // Call this with the library asset.
  public void StartGame(Asset asset)
  {
    ResetKeyState();
    InitPieceTable();

    m_asset = asset;
    m_window = Constructors.NewBrowser();

    // Reset all parameters.
    m_fallSpeed = 2.0;
    m_fallTime = 0.0;
    m_curPiece = -1;
    m_curX = 0;
    m_curY = 0;
    m_curRotation = 0;
    m_bRunning = true;

    UpdateDisplay();
    m_window.SetWindowVisible(true);

    int w = 300;
    int h = 500;
    m_window.SetWindowPosition(Interface.GetDisplayWidth() - w / 2, Interface.GetDisplayHeight() - h / 2);
  	m_window.SetWindowSize(w, h);
    GameLoop();
  }

  // ============================================================================
  // Display functionality
  // ============================================================================
  string GetDisplayHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    int cellSize = 64;

    // Hold box.

    // Game canvas.
    output.Print("<table>");
    int row, col;
    for (row = 0; row < NUM_ROWS; row++)
    {
      output.Print("<tr>");
      for (col = 0; col < NUM_COLS; col++)
      {
        output.Print("<td>");
        int cell = GetCell(col, row);
        if (cell != 0)
        {
          output.Print("<img src='easteregg/block.png' color=#" + GetHexString(cell) + " width=" + (string)cellSize + " height=" + (string)cellSize + ">");
        }
        else
        {
          output.Print("<img src='easteregg/slot.png' width=" + (string)cellSize + " height=" + (string)cellSize + ">");
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

  void UpdateDisplay()
  {
    m_window.LoadHTMLString(m_asset, GetDisplayHTML());
  }

  
  // ============================================================================
  // Game functionality
  // ============================================================================

  thread void GameLoop()
  {
    float timestep = 0.05;
    while (m_window and m_bRunning)
    {
      GameThink(timestep);
      ResetKeyState();
      UpdateDisplay();
      Router.GetCurrentThreadGameObject().Sleep(timestep);
    }
    m_window = null;
  }

  void GameOver()
  {
    m_bRunning = false;
  }

  void ChooseNewPiece()
  {
    int piece = Math.Rand(0, 7);

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

  void GameThink(float dt)
  {
    // At the beginning of the frame, always detach the piece from the board.
    DetachPiece();

    // Process input.
    if (m_bRotateLeft)
      RotatePieceLeft();
    else if (m_bRotateRight)
      RotatePieceRight();
    else if (m_bMoveLeft)
      MovePieceLeft();
    else if (m_bMoveRight)
      MovePieceRight();
    else if (m_bMoveDown)
      MovePieceDown();
    else if (m_bDrop)
      DropPiece();

    // Did our piece fall?
    bool movedDown = false;
    m_fallTime = m_fallTime + dt;
    while (m_fallTime > m_fallSpeed)
    {
      if (!MovePieceDown())
      {
        // Failed to move down. Place the block.
        AttachPiece();
        ChooseNewPiece();
      }
      movedDown = true;
      m_fallTime = m_fallTime - m_fallSpeed;
    }
    
    // Reattach the piece to the display at the end of the frame.
    AttachPiece();

    // Clear any full lines and add up the score!
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

    int local_x, local_y;
    for (local_y = 0; local_y < piece.GetHeight(); local_y++)
    {
      for (local_x = 0; local_x < piece.GetWidth(); local_x++)
      {
        if (piece.Get(local_x, local_y))
          SetCell(m_curX + local_x, m_curY + local_y, piece.GetColor());
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
    return CheckPiece(m_curRotation, 0, 1);
  }

  void MovePieceLeft()
  {
    CheckPiece(m_curRotation, -1, 0);
  }

  void MovePieceRight()
  {
    CheckPiece(m_curRotation, 1, 0);
  }

  void RotatePieceLeft()
  {
    int rot = m_curRotation - 1;
    if (rot < 0) rot = 3;
    SetPieceRotation(rot);
  }

  void RotatePieceRight()
  {
    int rot = m_curRotation + 1;
    if (rot > 3) rot = 0;
    SetPieceRotation(rot);
  }

  void DropPiece()
  {
    while (true)
    {
      if (!CheckPiece(m_curRotation, 0, 1))
        break;
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
    if (rot < 0 or rot > 3)
      return null;
    
    return m_pieceTable[piece * 4 + rot];
  }

};