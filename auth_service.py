import sqlite3

# WARNING: Hardcoded secret
JWT_SECRET = "super-secret-hardcoded-key-12345"

def authenticate_user(username, password):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    
    # BUG: Dangerous SQL injection vulnerability
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    # BUG: Resource leak — connection and file never closed
    log_file = open("audit.log", "a")
    log_file.write(f"Login attempted for: {username}\n")
    
    return user
