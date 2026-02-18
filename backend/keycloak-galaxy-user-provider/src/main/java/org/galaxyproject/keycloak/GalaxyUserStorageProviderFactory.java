package org.galaxyproject.keycloak;

import org.keycloak.component.ComponentModel;
import org.keycloak.component.ComponentValidationException;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.provider.ProviderConfigurationBuilder;
import org.keycloak.storage.UserStorageProviderFactory;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Factory for GalaxyUserStorageProvider. Manages configuration properties
 * (JDBC URL, credentials) and creates provider instances per transaction.
 */
public class GalaxyUserStorageProviderFactory
        implements UserStorageProviderFactory<GalaxyUserStorageProvider> {

    private static final Logger LOG = Logger.getLogger(GalaxyUserStorageProviderFactory.class.getName());

    public static final String PROVIDER_ID = "galaxy-user-provider";

    public static final String CONFIG_JDBC_URL = "jdbcUrl";
    public static final String CONFIG_DB_USER = "dbUser";
    public static final String CONFIG_DB_PASSWORD = "dbPassword";

    private static final List<ProviderConfigProperty> CONFIG_PROPERTIES;

    static {
        CONFIG_PROPERTIES = ProviderConfigurationBuilder.create()
                .property()
                    .name(CONFIG_JDBC_URL)
                    .type(ProviderConfigProperty.STRING_TYPE)
                    .label("JDBC URL")
                    .defaultValue("jdbc:postgresql://localhost:5432/galaxy")
                    .helpText("JDBC connection URL for the Galaxy PostgreSQL database")
                    .add()
                .property()
                    .name(CONFIG_DB_USER)
                    .type(ProviderConfigProperty.STRING_TYPE)
                    .label("Database User")
                    .defaultValue("galaxy")
                    .helpText("Username for the Galaxy database connection")
                    .add()
                .property()
                    .name(CONFIG_DB_PASSWORD)
                    .type(ProviderConfigProperty.PASSWORD)
                    .label("Database Password")
                    .helpText("Password for the Galaxy database connection")
                    .add()
                .build();
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return CONFIG_PROPERTIES;
    }

    @Override
    public GalaxyUserStorageProvider create(KeycloakSession session, ComponentModel model) {
        String jdbcUrl = model.get(CONFIG_JDBC_URL);
        String dbUser = model.get(CONFIG_DB_USER);
        String dbPassword = model.get(CONFIG_DB_PASSWORD);

        try {
            Connection connection = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword);
            return new GalaxyUserStorageProvider(session, model, connection);
        } catch (SQLException e) {
            LOG.log(Level.SEVERE, "Failed to connect to Galaxy database at " + jdbcUrl, e);
            throw new RuntimeException("Cannot connect to Galaxy database", e);
        }
    }

    @Override
    public void validateConfiguration(KeycloakSession session, RealmModel realm, ComponentModel model)
            throws ComponentValidationException {
        String jdbcUrl = model.get(CONFIG_JDBC_URL);
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            throw new ComponentValidationException("JDBC URL is required");
        }

        // Validate connection
        String dbUser = model.get(CONFIG_DB_USER);
        String dbPassword = model.get(CONFIG_DB_PASSWORD);
        try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword)) {
            LOG.info("Successfully validated Galaxy database connection to " + jdbcUrl);
        } catch (SQLException e) {
            throw new ComponentValidationException(
                    "Cannot connect to Galaxy database: " + e.getMessage());
        }
    }
}
