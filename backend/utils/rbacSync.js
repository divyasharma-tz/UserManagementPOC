import axios from 'axios';

/**
 * Fetches role mappings from external RBAC service
 * @param {string} sctToken - SCT token for authentication
 * @returns {Promise<Object>} Role mapping object { admin: "guid1", editor: "guid2", viewer: "guid3" }
 */
export async function fetchRoleMappings(sctToken) {
  try {
    const rolesApiUrl = process.env.RBAC_ROLES_API_URL || 'http://localhost:5006/api/v1/auth';
    const appName = process.env.RBAC_APP_NAME || 'usermanager';
    
    console.log(`[RBAC Sync] Fetching role mappings from ${rolesApiUrl}/roles/${appName}`);
    
    const response = await axios.get(`${rolesApiUrl}/roles/${appName}`, {
      headers: {
        'Token': sctToken
      }
    });

    // Parse response: { items: [{ id: "guid", key: "admin", label: "Admin", permissions: [] }] }
    const roles = response.data?.items || [];
    
    // Build mapping: { admin: "guid1", editor: "guid2", viewer: "guid3" }
    const mapping = {};
    roles.forEach(role => {
      if (role.key && role.id) {
        mapping[role.key] = role.id;
      }
    });

    console.log(`[RBAC Sync] Found ${Object.keys(mapping).length} roles:`, Object.keys(mapping).join(', '));
    return mapping;

  } catch (error) {
    console.error('[RBAC Sync] Error fetching role mappings:', error.message);
    if (error.response) {
      console.error('[RBAC Sync] Response status:', error.response.status);
      console.error('[RBAC Sync] Response data:', error.response.data);
    }
    throw new Error(`Failed to fetch role mappings: ${error.message}`);
  }
}

/**
 * Syncs user role to external RBAC service
 * @param {string} targetUserGuid - Daylight Core UUID of the user whose role is being updated
 * @param {string} roleKey - Role key (admin, editor, viewer)
 * @param {string} sctToken - SCT token for authentication (from admin making the change)
 * @returns {Promise<Object>} Response from RBAC service
 */
export async function syncRoleToRBAC(targetUserGuid, roleKey, sctToken) {
  try {
    console.log(`[RBAC Sync] Starting sync for user ${targetUserGuid} to role ${roleKey}`);

    // Step 1: Fetch role mappings to get the GUID for this roleKey
    const roleMappings = await fetchRoleMappings(sctToken);
    
    const roleGuid = roleMappings[roleKey];
    if (!roleGuid) {
      throw new Error(`Role "${roleKey}" not found in RBAC service. Available roles: ${Object.keys(roleMappings).join(', ')}`);
    }

    console.log(`[RBAC Sync] Mapped role "${roleKey}" to GUID: ${roleGuid}`);

    // Step 2: Call PUT endpoint to update user's role
    const updateApiUrl = process.env.RBAC_UPDATE_API_URL || 'http://localhost:5007/api/v1/auth';
    const appName = process.env.RBAC_APP_NAME || 'usermanager';
    
    const updateUrl = `${updateApiUrl}/users/${targetUserGuid}/app-roles/${appName}`;
    console.log(`[RBAC Sync] Updating role at: ${updateUrl}`);

    const response = await axios.put(
      updateUrl,
      { roleId: roleGuid },
      {
        headers: {
          'Token': sctToken,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[RBAC Sync] ✓ Successfully synced role for user ${targetUserGuid}`);
    return response.data;

  } catch (error) {
    console.error('[RBAC Sync] Error syncing role to RBAC:', error.message);
    if (error.response) {
      console.error('[RBAC Sync] Response status:', error.response.status);
      console.error('[RBAC Sync] Response data:', error.response.data);
    }
    throw new Error(`Failed to sync role to RBAC: ${error.message}`);
  }
}
