using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Infrastructure.Data;

/// <summary>Used by <c>dotnet ef</c> at design time. Runtime wiring lives in DependencyInjection.</summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<TeamFlowDbContext>
{
    public TeamFlowDbContext CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
                 ?? "Server=localhost;Database=TeamFlow;Trusted_Connection=True;TrustServerCertificate=True;";
        var options = new DbContextOptionsBuilder<TeamFlowDbContext>().UseSqlServer(cs).Options;
        return new TeamFlowDbContext(options, new TenantContext());
    }
}
