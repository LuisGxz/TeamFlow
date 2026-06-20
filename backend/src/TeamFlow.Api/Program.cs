using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TeamFlow.Api.Auth;
using TeamFlow.Api.Middleware;
using TeamFlow.Api.Multitenancy;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Infrastructure;
using TeamFlow.Infrastructure.Auth;
using TeamFlow.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));

// JWT bearer authentication.
var jwt = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
if (string.IsNullOrWhiteSpace(jwt.Secret))
    throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // keep "sub" as-is rather than remapping to NameIdentifier
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200"])
     .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Migrate + seed on boot (Development / when enabled).
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TeamFlowDbContext>();
    await db.Database.MigrateAsync();
    if (app.Configuration.GetValue("SeedDemoData", true))
        await DataSeeder.SeedAsync(db, DateOnly.FromDateTime(DateTime.UtcNow));
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantResolutionMiddleware>(); // after auth: needs the resolved user

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "teamflow-api" }));
app.MapControllers();

app.Run();

public partial class Program;
