using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeamFlow.Application;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Infrastructure.Auth;
using TeamFlow.Infrastructure.Common;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var cs = config.GetConnectionString("Default")
                 ?? "Server=localhost;Database=TeamFlow;Trusted_Connection=True;TrustServerCertificate=True;";

        // Tenant + RBAC context: one scoped instance behind both interfaces.
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());
        services.AddScoped<IWorkspaceContext>(sp => sp.GetRequiredService<TenantContext>());

        services.AddDbContext<TeamFlowDbContext>(opt => opt.UseSqlServer(cs, sql => sql.EnableRetryOnFailure(3)));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<TeamFlowDbContext>());

        services.AddSingleton<IClock, SystemClock>();

        // Settings.
        services.Configure<JwtSettings>(config.GetSection(JwtSettings.SectionName));
        services.Configure<AuthSettings>(config.GetSection(AuthSettings.SectionName));

        // Auth primitives.
        services.AddSingleton<IPasswordHasher, PasswordHasherAdapter>();
        services.AddSingleton<ITokenHasher, TokenHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        services.AddApplication();

        return services;
    }
}
