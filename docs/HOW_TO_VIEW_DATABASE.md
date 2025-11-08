# 🔍 CARA MELIHAT DATABASE - STEP BY STEP

## Method 1: pgAdmin (RECOMMENDED - Visual & Mudah)

### Download & Install pgAdmin
1. Download: https://www.pgadmin.org/download/
2. Pilih: **Windows** → Download installer
3. Install seperti biasa (Next, Next, Finish)
4. **GRATIS!** Tidak perlu bayar

### Connect ke Database
1. Buka pgAdmin
2. Klik kanan "Servers" → Create → Server

**General Tab:**
- Name: `Pro Livechat Local`

**Connection Tab:**
- Host: `localhost` atau `127.0.0.1`
- Port: `5432`
- Database: `prochat_db`
- Username: `prochatadmin`
- Password: `prochatpassword123`

3. Klik **Save**

### Melihat Data
```
Servers
└── Pro Livechat Local
    └── Databases
        └── prochat_db
            └── Schemas
                └── public
                    ├── Tables (Klik ini!)
                    │   ├── Users (klik kanan → View Data → All Rows)
                    │   ├── Visitors
                    │   ├── Conversations
                    │   ├── Messages
                    │   └── ...
                    └── Indexes (Lihat indexes yang baru dibuat!)
```

---

## Method 2: DBeaver (Alternative - Lebih Ringan)

### Download & Install
1. Download: https://dbeaver.io/download/
2. Pilih: **Windows 64-bit**
3. Install seperti biasa
4. **GRATIS!**

### Connect
1. Buka DBeaver
2. Database → New Database Connection
3. Pilih **PostgreSQL**
4. Connection Settings:
   - Host: `localhost`
   - Port: `5432`
   - Database: `prochat_db`
   - Username: `prochatadmin`
   - Password: `prochatpassword123`
5. Test Connection → Finish

### Lihat Data
- Expand: `prochat_db` → `Schemas` → `public` → `Tables`
- Klik table → Tab "Data"
- **SEE YOUR DATA IN TABLE FORMAT!** 📊

---

## Method 3: Docker CLI (Terminal - No Install Needed!)

### Connect ke Database
```bash
# Windows CMD
docker exec -it prochat-db psql -U prochatadmin -d prochat_db
```

### Perintah Berguna

#### 1. Lihat Semua Table
```sql
\dt
```
Output:
```
           List of relations
 Schema |       Name        | Type  |     Owner     
--------+-------------------+-------+---------------
 public | Conversations     | table | prochatadmin
 public | Messages          | table | prochatadmin
 public | Users             | table | prochatadmin
 public | Visitors          | table | prochatadmin
 public | Websites          | table | prochatadmin
 public | ai_knowledges     | table | prochatadmin
 public | ai_personas       | table | prochatadmin
 public | ai_rules          | table | prochatadmin
(8 rows)
```

#### 2. Lihat Struktur Table
```sql
\d Messages
```
Output:
```
                           Table "public.Messages"
     Column      |           Type           | Nullable |      Default      
-----------------+--------------------------+----------+-------------------
 id              | uuid                     | not null | 
 senderType      | character varying(255)   | not null | 
 senderId        | uuid                     |          | 
 contentType     | character varying(255)   | not null | 'text'
 content         | text                     | not null | 
 isRead          | boolean                  | not null | false
 conversationId  | uuid                     |          | 
 createdAt       | timestamp with time zone | not null | 
 updatedAt       | timestamp with time zone | not null | 
 deletedAt       | timestamp with time zone |          |  <-- SOFT DELETE!
Indexes:
    "Messages_pkey" PRIMARY KEY, btree (id)
    "idx_messages_conversation_id" btree (conversationId)          <-- NEW!
    "idx_messages_created_at" btree (createdAt)                    <-- NEW!
    "idx_messages_is_read" btree (isRead)                          <-- NEW!
    "idx_messages_conversation_unread_time" btree (conversationId, isRead, createdAt) <-- NEW!
    "idx_messages_sender_type" btree (senderType)                  <-- NEW!
    "idx_messages_deleted_at" btree (deletedAt)                    <-- NEW!
```

#### 3. Lihat SEMUA Indexes (BUKTI OPTIMASI!)
```sql
\di
```
Output akan menunjukkan **15+ indexes baru** yang kita buat!

#### 4. Query Data
```sql
-- Lihat 10 messages terakhir
SELECT * FROM "Messages" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Hitung total messages
SELECT COUNT(*) FROM "Messages";

-- Lihat conversations yang open
SELECT * FROM "Conversations" 
WHERE status = 'open';

-- Lihat unread messages
SELECT COUNT(*) FROM "Messages" 
WHERE "isRead" = false;
```

#### 5. Check Query Performance (BUKTI CEPAT!)
```sql
-- Enable timing
\timing

-- Query TANPA index (slow)
-- (Tidak bisa kita test karena sudah ada index)

-- Query DENGAN index (fast!)
SELECT * FROM "Messages" 
WHERE "conversationId" = 'some-uuid-here'
ORDER BY "createdAt" DESC;

-- Output akan menunjukkan waktu eksekusi:
-- Time: 3.245 ms  <-- CEPAT! (tanpa index: 100-500ms)
```

#### 6. Exit
```sql
\q
```

---

## Method 4: VS Code Extension (In-Editor!)

### Install Extension
1. Buka VS Code
2. Extensions (Ctrl+Shift+X)
3. Search: **PostgreSQL** by Chris Kolkman
4. Install

### Connect
1. Click "PostgreSQL" icon di sidebar
2. Add Connection:
   - Host: `localhost`
   - Username: `prochatadmin`
   - Password: `prochatpassword123`
   - Port: `5432`
   - Database: `prochat_db`

### Lihat Data
- Expand connection → Tables
- Right click table → "Select Top 1000"
- **SEE DATA IN VS CODE!** 🎉

---

## 📸 SCREENSHOT GUIDE

### What You Should See:

#### pgAdmin - Tables View
```
📁 prochat_db
  📁 Schemas
    📁 public
      📁 Tables (8 tables)
        📄 Users
        📄 Visitors
        📄 Websites
        📄 Conversations
        📄 Messages
        📄 ai_personas
        📄 ai_rules
        📄 ai_knowledges
      📁 Indexes (15+ indexes!) ← BUKTI OPTIMASI
```

#### Data View (Right click table → View Data)
```
+--------------------------------------+-------------+----------+-----+
| id                                   | senderType  | content  | ... |
+--------------------------------------+-------------+----------+-----+
| 123e4567-e89b-12d3-a456-426614174000 | visitor     | Hello!   | ... |
| 123e4567-e89b-12d3-a456-426614174001 | admin       | Hi there | ... |
+--------------------------------------+-------------+----------+-----+
```

---

## 🔍 QUICK VERIFICATION CHECKLIST

Setelah run migrations, verify ini:

### 1. Check Tables Exist
```bash
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\dt"
```
✅ Harus ada 8 tables

### 2. Check Indexes Created
```bash
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\di"
```
✅ Harus ada 15+ indexes baru (nama mulai dengan `idx_`)

### 3. Check Soft Delete Column
```bash
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "\d Messages"
```
✅ Harus ada column `deletedAt`

### 4. Check Data Count
```bash
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "SELECT COUNT(*) FROM \"Messages\";"
```
✅ Akan menunjukkan jumlah messages

---

## 💡 TIPS

### Export Data ke Excel/CSV
```sql
-- In psql:
\copy (SELECT * FROM "Messages") TO 'messages_export.csv' CSV HEADER;
```

### Backup via pgAdmin
1. Right click `prochat_db`
2. Backup...
3. Filename: `backup_YYYY-MM-DD.backup`
4. Format: Custom
5. Click Backup

### Import Sample Data (Testing)
```sql
-- Insert test conversation
INSERT INTO "Conversations" (id, status, "isAiActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'open', true, NOW(), NOW());

-- Insert test message
INSERT INTO "Messages" (id, "senderType", "contentType", content, "isRead", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'visitor', 'text', 'Test message from terminal!', false, NOW(), NOW());
```

---

## ❓ TROUBLESHOOTING

### Error: "Connection refused"
```bash
# Check if container running
docker ps | grep prochat-db

# If not running:
docker-compose up -d
```

### Error: "Password authentication failed"
```bash
# Verify credentials in .env file
cat .env | grep DB_
```

### Can't see new indexes?
```bash
# Check migration status
cd server
npx sequelize-cli db:migrate:status

# If not run yet:
npm run migrate
```

---

## 📚 LEARNING RESOURCES

### SQL Basics
- https://www.postgresqltutorial.com/
- https://www.w3schools.com/sql/

### pgAdmin Tutorial
- https://www.pgadmin.org/docs/pgadmin4/latest/getting_started.html

### PostgreSQL Cheat Sheet
- https://postgrescheatsheet.com/

---

**Pilih method yang paling nyaman untuk Anda:**
- **Pemula:** pgAdmin (visual, klik-klik)
- **Intermediate:** DBeaver (lebih ringan)
- **Advanced:** Docker CLI (terminal, no install)
- **In VS Code:** PostgreSQL extension

**Setelah connect, Anda bisa lihat semua data dalam format tabel yang mudah dibaca!** 📊
