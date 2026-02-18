package org.galaxyproject.keycloak;

import org.keycloak.component.ComponentModel;
import org.keycloak.credential.CredentialInput;
import org.keycloak.credential.CredentialInputUpdater;
import org.keycloak.credential.CredentialInputValidator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.storage.ReadOnlyException;
import org.keycloak.storage.StorageId;
import org.keycloak.storage.UserStorageProvider;
import org.keycloak.storage.user.UserLookupProvider;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Stream;

/**
 * Keycloak User Storage SPI provider that authenticates users against
 * Galaxy's galaxy_user table. Read-only: passwords are verified against
 * Galaxy's PBKDF2-SHA256 hashes but never written to.
 */
public class GalaxyUserStorageProvider implements
        UserStorageProvider,
        UserLookupProvider,
        CredentialInputValidator,
        CredentialInputUpdater {

    private static final Logger LOG = Logger.getLogger(GalaxyUserStorageProvider.class.getName());

    private static final String QUERY_BY_EMAIL =
            "SELECT id, email, username, password FROM galaxy_user " +
            "WHERE email = ? AND deleted = false AND active = true";

    private static final String QUERY_BY_USERNAME =
            "SELECT id, email, username, password FROM galaxy_user " +
            "WHERE username = ? AND deleted = false AND active = true";

    private final KeycloakSession session;
    private final ComponentModel model;
    private final Connection connection;

    // Per-transaction cache: external ID (email) -> adapter
    private final Map<String, GalaxyUserAdapter> loadedUsers = new HashMap<>();
    // Per-transaction cache: external ID (email) -> stored password hash
    private final Map<String, String> passwordCache = new HashMap<>();

    public GalaxyUserStorageProvider(
            KeycloakSession session,
            ComponentModel model,
            Connection connection) {
        this.session = session;
        this.model = model;
        this.connection = connection;
    }

    // --- UserLookupProvider ---

    @Override
    public UserModel getUserByUsername(RealmModel realm, String username) {
        // Galaxy uses email as the primary login, but also try username
        GalaxyUserAdapter adapter = findUser(realm, QUERY_BY_EMAIL, username);
        if (adapter == null) {
            adapter = findUser(realm, QUERY_BY_USERNAME, username);
        }
        return adapter;
    }

    @Override
    public UserModel getUserByEmail(RealmModel realm, String email) {
        return findUser(realm, QUERY_BY_EMAIL, email);
    }

    @Override
    public UserModel getUserById(RealmModel realm, String id) {
        StorageId storageId = new StorageId(id);
        String externalId = storageId.getExternalId();
        return getUserByEmail(realm, externalId);
    }

    private GalaxyUserAdapter findUser(RealmModel realm, String query, String param) {
        // Check cache first
        for (GalaxyUserAdapter cached : loadedUsers.values()) {
            if (cached.getEmail().equalsIgnoreCase(param)
                    || cached.getUsername().equalsIgnoreCase(param)) {
                return cached;
            }
        }

        try (PreparedStatement ps = connection.prepareStatement(query)) {
            ps.setString(1, param);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    String galaxyId = rs.getString("id");
                    String email = rs.getString("email");
                    String username = rs.getString("username");
                    String password = rs.getString("password");

                    GalaxyUserAdapter adapter = new GalaxyUserAdapter(
                            session, realm, model, galaxyId, username, email
                    );
                    loadedUsers.put(email, adapter);
                    passwordCache.put(email, password);
                    return adapter;
                }
            }
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Error querying Galaxy user database", e);
        }
        return null;
    }

    // --- CredentialInputValidator ---

    @Override
    public boolean supportsCredentialType(String credentialType) {
        return PasswordCredentialModel.TYPE.equals(credentialType);
    }

    @Override
    public boolean isConfiguredFor(RealmModel realm, UserModel user, String credentialType) {
        if (!supportsCredentialType(credentialType)) return false;
        String email = user.getEmail();
        return email != null && passwordCache.containsKey(email);
    }

    @Override
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        if (!supportsCredentialType(input.getType())) return false;

        String email = user.getEmail();
        String storedHash = passwordCache.get(email);
        if (storedHash == null) return false;

        return GalaxyPasswordUtil.verify(input.getChallengeResponse(), storedHash);
    }

    // --- CredentialInputUpdater (read-only) ---

    @Override
    public boolean updateCredential(RealmModel realm, UserModel user, CredentialInput input) {
        if (PasswordCredentialModel.TYPE.equals(input.getType())) {
            throw new ReadOnlyException("Galaxy user passwords are managed by Galaxy");
        }
        return false;
    }

    @Override
    public void disableCredentialType(RealmModel realm, UserModel user, String credentialType) {
        // read-only
    }

    @Override
    public Stream<String> getDisableableCredentialTypesStream(RealmModel realm, UserModel user) {
        return Stream.empty();
    }

    // --- Lifecycle ---

    @Override
    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            LOG.log(Level.WARNING, "Error closing Galaxy DB connection", e);
        }
    }
}
