const assert = require("node:assert");
const { DatabaseSync } = require("node:sqlite");

console.log("▶ Running Ponytail RBAC & Prodi-Scope Multi-Jurusan check...");

const db = new DatabaseSync(":memory:");

// 1. Setup multi-prodi schema
db.exec(`
  CREATE TABLE prodi (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kode TEXT UNIQUE NOT NULL,
    fakultas TEXT DEFAULT 'Ilmu Komputer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE kelas (
    id TEXT PRIMARY KEY,
    prodi_id TEXT,
    nama TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    FOREIGN KEY (prodi_id) REFERENCES prodi(id)
  );

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    nim TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'mahasiswa',
    prodi_id TEXT,
    fakultas TEXT,
    kelas_id TEXT,
    FOREIGN KEY (prodi_id) REFERENCES prodi(id),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
  );
`);

// 2. Seed Prodi & Kelas
db.exec(`
  INSERT INTO prodi (id, nama, kode, fakultas) VALUES ('prodi-si', 'Sistem Informasi', 'SI', 'Ilmu Komputer');
  INSERT INTO prodi (id, nama, kode, fakultas) VALUES ('prodi-ti', 'Teknik Informatika', 'TI', 'Ilmu Komputer');
  INSERT INTO prodi (id, nama, kode, fakultas) VALUES ('prodi-manajemen', 'Manajemen', 'MN', 'Ekonomi');

  INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES ('k-si-3a', 'prodi-si', 'SI-3A', '2026/2027');
  INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES ('k-ti-3a', 'prodi-ti', 'TI-3A', '2026/2027');
  INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES ('k-mn-1a', 'prodi-manajemen', 'MN-1A', '2026/2027');

  INSERT INTO users (id, nim, nama, role, prodi_id, kelas_id) VALUES ('m-si-1', '21001', 'Mhs SI 1', 'mahasiswa', 'prodi-si', 'k-si-3a');
  INSERT INTO users (id, nim, nama, role, prodi_id, kelas_id) VALUES ('m-ti-1', '22001', 'Mhs TI 1', 'mahasiswa', 'prodi-ti', 'k-ti-3a');
  INSERT INTO users (id, nim, nama, role, prodi_id, kelas_id) VALUES ('m-mn-1', '23001', 'Mhs MN 1', 'mahasiswa', 'prodi-manajemen', 'k-mn-1a');

  INSERT INTO users (id, nim, nama, role, prodi_id) VALUES ('u-super', 'super', 'Super Admin', 'super_admin', NULL);
  INSERT INTO users (id, nim, nama, role, prodi_id) VALUES ('u-admin-ti', 'adm_ti', 'Admin TI', 'admin', 'prodi-ti');
  INSERT INTO users (id, nim, nama, role, fakultas) VALUES ('u-dekan-ilkom', 'dekan_ilkom', 'Dekan Fasilkom', 'admin', 'Ilmu Komputer');
`);

console.log("✔ Schema and tables setup: PASS");

// 3. Test Scoping rules
function queryMahasiswa(user) {
  if (user.role === "super_admin") {
    return db.prepare("SELECT u.nama, k.nama as kelas, p.kode, p.fakultas FROM users u JOIN kelas k ON u.kelas_id = k.id JOIN prodi p ON k.prodi_id = p.id WHERE u.role = 'mahasiswa'").all();
  } else if (user.prodi_id) {
    return db.prepare("SELECT u.nama, k.nama as kelas, p.kode, p.fakultas FROM users u JOIN kelas k ON u.kelas_id = k.id JOIN prodi p ON k.prodi_id = p.id WHERE u.role = 'mahasiswa' AND k.prodi_id = ?").all(user.prodi_id);
  } else if (user.fakultas) {
    return db.prepare("SELECT u.nama, k.nama as kelas, p.kode, p.fakultas FROM users u JOIN kelas k ON u.kelas_id = k.id JOIN prodi p ON k.prodi_id = p.id WHERE u.role = 'mahasiswa' AND p.fakultas = ?").all(user.fakultas);
  }
  return [];
}

const superAdmin = { id: "u-super", role: "super_admin", prodi_id: null };
const tiAdmin = { id: "u-admin-ti", role: "admin", prodi_id: "prodi-ti" };
const dekanIlkom = { id: "u-dekan-ilkom", role: "admin", fakultas: "Ilmu Komputer" };

const superResult = queryMahasiswa(superAdmin);
assert.strictEqual(superResult.length, 3, "Super Admin sees all students across entire campus (SI, TI, MN)");

const tiResult = queryMahasiswa(tiAdmin);
assert.strictEqual(tiResult.length, 1, "Admin TI only sees students in TI prodi");
assert.strictEqual(tiResult[0].nama, "Mhs TI 1", "Admin TI cannot see SI or MN students");

const dekanResult = queryMahasiswa(dekanIlkom);
assert.strictEqual(dekanResult.length, 2, "Dekan Fasilkom sees all students in Ilmu Komputer faculty (SI + TI)");
assert.ok(dekanResult.some(s => s.nama === "Mhs SI 1"));
assert.ok(dekanResult.some(s => s.nama === "Mhs TI 1"));
assert.ok(!dekanResult.some(s => s.nama === "Mhs MN 1"), "Dekan Fasilkom cannot see Ekonomi faculty students");
console.log("✔ Admin Prodi & Dekan Fakultas scope query isolation: PASS");

// 4. Test mutation boundary authorization
function canMutateKelas(user, kelasId) {
  if (user.role === "super_admin") return true;
  const k = db.prepare("SELECT k.prodi_id, p.fakultas FROM kelas k JOIN prodi p ON k.prodi_id = p.id WHERE k.id = ?").get(kelasId);
  if (!k) return false;
  if (user.prodi_id && k.prodi_id === user.prodi_id) return true;
  if (user.fakultas && k.fakultas === user.fakultas) return true;
  return false;
}

assert.strictEqual(canMutateKelas(superAdmin, "k-si-3a"), true, "Super Admin can mutate SI class");
assert.strictEqual(canMutateKelas(superAdmin, "k-ti-3a"), true, "Super Admin can mutate TI class");
assert.strictEqual(canMutateKelas(superAdmin, "k-mn-1a"), true, "Super Admin can mutate MN class");

assert.strictEqual(canMutateKelas(tiAdmin, "k-ti-3a"), true, "TI Admin can mutate TI class");
assert.strictEqual(canMutateKelas(tiAdmin, "k-si-3a"), false, "TI Admin REJECTED from mutating SI class");

assert.strictEqual(canMutateKelas(dekanIlkom, "k-si-3a"), true, "Dekan Fasilkom can mutate SI class");
assert.strictEqual(canMutateKelas(dekanIlkom, "k-ti-3a"), true, "Dekan Fasilkom can mutate TI class");
assert.strictEqual(canMutateKelas(dekanIlkom, "k-mn-1a"), false, "Dekan Fasilkom REJECTED from mutating Ekonomi class");
console.log("✔ Mutation boundary authorization (Super Admin, Dekan, Kaprodi): PASS");

console.log("🎉 ALL RBAC & MULTI-PRODI & FAKULTAS TESTS PASSED SUCCESSFULLY!");
