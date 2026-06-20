using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TeamFlow.Application.Auth;
using TeamFlow.Application.Boards;
using TeamFlow.Application.Cards;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Application.Workspaces;

namespace TeamFlow.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        services.AddScoped<IActivityRecorder, ActivityRecorder>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IBoardService, BoardService>();
        services.AddScoped<ICardService, CardService>();

        return services;
    }
}
