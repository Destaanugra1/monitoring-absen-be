/**
 * Cara menggunakan admin dashboard:
 * 
 * 1. Setup role Admin di Clerk:
 *    - Buka Clerk Dashboard
 *    - Pilih user yang ingin dijadikan admin
 *    - Di bagian Metadata > Public Metadata, tambahkan:
 *      {
 *        "role": "admin"
 *      }
 * 
 * 2. Atau gunakan Clerk API untuk set role programmatically:
 *    ```javascript
 *    const { clerkClient } = require('@clerk/express')
 *    
 *    await clerkClient.users.updateUserMetadata(userId, {
 *      publicMetadata: { role: 'admin' }
 *    })
 *    ```
 * 
 * 3. Akses admin dashboard di: /admin
 * 
 * 4. Fitur yang tersedia:
 *    - Overview: Statistik sistem
 *    - User Management: List user dan ubah role
 *    - Data Management: 
 *      - Bulk delete peserta
 *      - Delete hari (akan menghapus semua materi dan keaktifan terkait)
 *      - Delete materi (akan menghapus keaktifan terkait)
 * 
 * 5. Role hierarchy:
 *    - admin: Full access ke admin panel + dashboard panitia
 *    - panitia: Access ke dashboard panitia only
 *    - user: Basic access only
 */

// Script untuk set admin role via backend
// Jalankan di console backend atau buat endpoint khusus
const { clerkClient } = require('@clerk/express')

async function setAdminRole(userId) {
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'admin' }
    })
    console.log(`Successfully set admin role for user: ${userId}`)
  } catch (error) {
    console.error('Error setting admin role:', error)
  }
}

// Example usage:
// setAdminRole('user_2abc123def456')

module.exports = { setAdminRole }