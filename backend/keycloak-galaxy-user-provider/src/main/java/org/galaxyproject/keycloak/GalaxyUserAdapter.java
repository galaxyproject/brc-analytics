package org.galaxyproject.keycloak;

import org.keycloak.component.ComponentModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.storage.adapter.AbstractUserAdapterFederatedStorage;

/**
 * Maps a galaxy_user row to Keycloak's UserModel interface.
 * Read-only: Galaxy DB is the source of truth.
 */
public class GalaxyUserAdapter extends AbstractUserAdapterFederatedStorage {

    private final String username;
    private final String email;
    private final String galaxyUserId;

    public GalaxyUserAdapter(
            KeycloakSession session,
            RealmModel realm,
            ComponentModel storageProviderModel,
            String galaxyUserId,
            String username,
            String email) {
        super(session, realm, storageProviderModel);
        this.galaxyUserId = galaxyUserId;
        this.username = username;
        this.email = email;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public void setUsername(String username) {
        // read-only
    }

    @Override
    public String getEmail() {
        return email;
    }

    @Override
    public void setEmail(String email) {
        // read-only
    }

    @Override
    public String getFirstName() {
        return username;
    }

    @Override
    public String getLastName() {
        return "";
    }

    @Override
    public boolean isEmailVerified() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    /**
     * The external ID stored in Keycloak's StorageId.
     * We use the Galaxy user's email as the external key since
     * that's the primary login identifier in Galaxy.
     */
    public String getGalaxyUserId() {
        return galaxyUserId;
    }
}
