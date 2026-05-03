{
  "realm": "academic-journal",
  "displayName": "Academic Journal",
  "enabled": true,
  "registrationAllowed": false,
  "registrationEmailAsUsername": true,
  "rememberMe": true,
  "verifyEmail": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "sslRequired": "external",
  "accessTokenLifespan": 1800,
  "accessTokenLifespanForImplicitFlow": 900,
  "ssoSessionIdleTimeout": 3600,
  "ssoSessionMaxLifespan": 36000,
  "offlineSessionIdleTimeout": 2592000,
  "defaultSignatureAlgorithm": "RS256",
  "internationalizationEnabled": true,
  "supportedLocales": ["en", "ro"],
  "defaultLocale": "en",
  "defaultRoles": ["AUTHOR"],
  "roles": {
    "realm": [
      { "name": "ADMIN",            "description": "Site/journal administrator" },
      { "name": "EDITOR",           "description": "Editor with full editorial workflow control" },
      { "name": "SECTION_EDITOR",   "description": "Editor scoped to specific sections (scope tracked locally)" },
      { "name": "AUTHOR",           "description": "Submits and revises manuscripts" },
      { "name": "REVIEWER",         "description": "Accepts and submits peer reviews" },
      { "name": "PRODUCTION_STAFF", "description": "Copyediting / production / proofreading staff" }
    ]
  },
  "clients": [
    {
      "clientId": "aj-spa",
      "name": "Academic Journal SPA",
      "description": "Frontend single-page apps (public site + editorial dashboard)",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": false,
      "fullScopeAllowed": true,
      "redirectUris": [
        "http://localhost:3000/*",
        "http://localhost:5173/*",
        "http://127.0.0.1:3000/*",
        "http://127.0.0.1:5173/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
      ],
      "attributes": {
        "pkce.code.challenge.method": "S256",
        "post.logout.redirect.uris": "http://localhost:3000/*##http://localhost:5173/*"
      },
      "protocolMappers": [
        {
          "name": "realm-roles-in-token",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-realm-role-mapper",
          "config": {
            "claim.name": "realm_access.roles",
            "jsonType.label": "String",
            "multivalued": "true",
            "userinfo.token.claim": "true",
            "id.token.claim": "true",
            "access.token.claim": "true"
          }
        }
      ]
    },
    {
      "clientId": "aj-backend",
      "name": "Academic Journal Backend",
      "description": "Bearer-only resource server identifier",
      "enabled": true,
      "bearerOnly": true,
      "publicClient": false,
      "standardFlowEnabled": false,
      "directAccessGrantsEnabled": false
    }
  ],
  "users": [
    {
      "username": "admin@journal.local",
      "email": "admin@journal.local",
      "firstName": "Test",
      "lastName": "Admin",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        { "type": "password", "value": "${KC_USER_ADMIN_PASSWORD}", "temporary": false }
      ],
      "realmRoles": ["ADMIN", "EDITOR", "AUTHOR"],
      "attributes": { "locale": ["en"] }
    },
    {
      "username": "editor@journal.local",
      "email": "editor@journal.local",
      "firstName": "Test",
      "lastName": "Editor",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        { "type": "password", "value": "${KC_USER_EDITOR_PASSWORD}", "temporary": false }
      ],
      "realmRoles": ["EDITOR", "AUTHOR"],
      "attributes": { "locale": ["en"] }
    },
    {
      "username": "reviewer@journal.local",
      "email": "reviewer@journal.local",
      "firstName": "Test",
      "lastName": "Reviewer",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        { "type": "password", "value": "${KC_USER_REVIEWER_PASSWORD}", "temporary": false }
      ],
      "realmRoles": ["REVIEWER", "AUTHOR"],
      "attributes": { "locale": ["en"] }
    },
    {
      "username": "author@journal.local",
      "email": "author@journal.local",
      "firstName": "Test",
      "lastName": "Author",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        { "type": "password", "value": "${KC_USER_AUTHOR_PASSWORD}", "temporary": false }
      ],
      "realmRoles": ["AUTHOR"],
      "attributes": { "locale": ["en"] }
    }
  ],
  "smtpServer": {
    "host": "mailpit",
    "port": "1025",
    "fromDisplayName": "Academic Journal",
    "from": "noreply@journal.local",
    "ssl": "false",
    "starttls": "false",
    "auth": "false"
  }
}
