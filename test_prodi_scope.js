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
    kelas_id TEXT,
    FOREIGN KEY (prodi_id) REFERENCES prodi(id),
    FOREIGN KEY (kelas_id) REFERENCES kelas(id)
  );
`);

// 2. Seed Prodi & Kelas
db.exec(`
  INSERT INTO prodi (id, nama, kode) VALUES ('prodi-si', 'Sistem Informasi', 'SI');
  INSERT INTO prodi (id, nama, kode) VALUES ('prodi-ti', 'Teknik Informatika', 'TI');

  INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES ('k-si-3a', 'prodi-si', 'SI-3A', '2026/2027');
  INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES ('k-ti-3a', 'prodi-ti', 'TI-3A', '2026/2027');

  INSERT INTO users (id, nim, nama, role, prodi_id, kelas_id) VALUES ('m-si-1', '21001', 'Mhs SI 1', 'mahasiswa', 'prodi-si', 'k-si-3a');
  INSERT INTO users (id, nim, nama, role, prodi_id, kelas_id) VALUES ('m-ti-1', '22001', 'Mhs TI 1', 'mahasiswa', 'prodi-ti', 'k-ti-3a');

  INSERT INTO users (id, nim, nama, role, prodi_id) VALUES ('u-super', 'super', 'Super Admin', 'super_admin', NULL);
  INSERT INTO users (id, nim, nama, role, prodi_id) VALUES ('u-admin-ti', 'adm_ti', 'Admin TI', 'admin', 'prodi-ti');
`);

console.log("✔ Schema and tables setup: PASS");

// 3. Test Scoping rules
function queryMahasiswa(user) {
  if (user.role === "super_admin") {
    return db.prepare("SELECT u.nama, k.nama as kelas, p.kode FROM users u JOIN kelas k ON u.kelas_id = k.id JOIN prodi p ON k.prodi_id = p.id WHERE u.role = 'mahasiswa'").all();
  } else {
    return db.prepare("SELECT u.nama, k.nama as kelas, p.kode FROM users u JOIN kelas k ON u.kelas_id = k.id JOIN prodi p ON k.prodi_id = p.id WHERE u.role = 'mahasiswa' AND k.prodi_id = ?").all(user.prodi_id);
  }
}

const superAdmin = { id: "u-super", role: "super_admin", prodi_id: null };
const tiAdmin = { id: "u-admin-ti", role: "admin", prodi_id: "prodi-ti" };

const superResult = queryMahasiswa(superAdmin);
assert.strictEqual(superResult.length, 2, "Super Admin sees all students across all prodi");

const tiResult = queryMahasiswa(tiAdmin);
assert.strictEqual(tiResult.length, 1, "Admin TI only sees students in their own prodi");
assert.strictEqual(tiResult[0].nama, "Mhs TI 1", "Admin TI cannot see SI students");
console.log("✔ Admin Prodi scope query isolation: PASS");

// 4. Test mutation boundary authorization
function canMutateKelas(user, kelasId) {
  if (user.role === "super_admin") return true;
  const k = db.prepare("SELECT prodi_id FROM kelas WHERE id = ?").get(kelasId);
  return Boolean(k && k.prodi_id === user.prodi_id);
}

assert.strictEqual(canMutateKelas(superAdmin, "k-si-3a"), true, "Super Admin can mutate SI class");
assert.strictEqual(canMutateKelas(superAdmin, "k-ti-3a"), true, "Super Admin can mutate TI class");
assert.strictEqual(canMutateKelas(tiAdmin, "k-ti-3a"), true, "TI Admin can mutate TI class");
assert.strictEqual(canMutateKelas(tiAdmin, "k-si-3a"), false, "TI Admin REJECTED from mutating SI class");
console.log("✔ Mutation boundary authorization: PASS");

console.log("🎉 ALL RBAC & MULTI-PRODI TESTS PASSED SUCCESSFULLY!");
