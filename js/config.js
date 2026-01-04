const API_BASE = "https://akijair.ibos.io";

const USER_MGMT   = API_BASE + "/user-management/v1";
const CONFIG_MGMT = API_BASE + "/configuration-management/v1";

const API = {
    auth: {
        login: USER_MGMT + "/auth/admin-login",
        logs: USER_MGMT + "/auth/login-logs",
        partnerLogs: (partnerId) =>
            USER_MGMT + `/auth/login-logs/${partnerId}/logs`
    },

    access: {
        base: USER_MGMT + "/access-control",
        mode: USER_MGMT + "/access-control/mode",
        switchMode: USER_MGMT + "/access-control/mode/switch",
        rules: USER_MGMT + "/access-control/all",
        single: (id) => USER_MGMT + `/access-control/${id}`
    },

    pricing: {
        preview: CONFIG_MGMT + "/supplier-info/pricing/preview"
    },

    lookups: {
        partners: USER_MGMT + "/lookups/active-approved-b2b-partners",
        groups:   CONFIG_MGMT + "/lookups/fmg-groups",
        journeys: CONFIG_MGMT + "/lookups/journey-types"
    }
};
