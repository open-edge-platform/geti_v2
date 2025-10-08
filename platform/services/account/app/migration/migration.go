// Copyright (C) 2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

package migration

import (
    "account_service/app/common/utils"
	"account_service/app/config"
	"account_service/app/roles"

	v1 "github.com/authzed/authzed-go/proto/authzed/api/v1"
)

var logger = utils.InitializeLogger()

// MigrateUsers performs user data migration tasks.
// As it is executed every time the service starts, ensure idempotency.
func MigrateUsers() {
    logger.Info("User data migration tasks - start")
    if config.FeatureFlagWorkspaceActions {
        RemoveWorkspaceAdminsForOrgAdmins()
    }
    logger.Info("User data migration tasks - stop")
}

// RemoveWorkspaceAdminsForOrgAdmins removes all superfluous workspace admin roles for users
// who are already organization admins. Executed only if the FeatureFlagWorkspaceActions is enabled
func RemoveWorkspaceAdminsForOrgAdmins() {
    logger.Info("Removal of workspace admins for org admins - start")
    rolesMgr, err := roles.NewRolesManager(config.SpiceDBAddress, config.SpiceDBToken)

	if err != nil {
		logger.Errorf("Removal of workspace admins for org admins - unable to get roles manager: %v", err)
		return
	}

	orgAdminsFilter := v1.RelationshipFilter{
		ResourceType:       "organization",
		OptionalRelation:   "organization_admin",
	}

	orgAdminsList, err := rolesMgr.GetRelationships(&orgAdminsFilter)

	if err != nil {
		logger.Errorf("Removal of workspace admins for org admins - unable to get list of org admins: %v", err)
		return
	}

    for _, orgRelationship := range orgAdminsList {
        userID := orgRelationship.Subject.Object.ObjectId
        // Get workspace_admin relationship for a given user
        workspaceAdminsFilter := v1.RelationshipFilter{
            OptionalSubjectFilter: &v1.SubjectFilter{
                SubjectType:       "user",
                OptionalSubjectId: userID,
            },
            OptionalRelation:   "workspace_admin",
        }

        workspaceAdminsList, err := rolesMgr.GetRelationships(&workspaceAdminsFilter)
        if err != nil {
            logger.Errorf("Removal of workspace admins for org admins - unable to get list of workspace admins for user %s: %v", userID, err)
            continue
        }

        for _, relationship := range workspaceAdminsList {

            err := rolesMgr.ChangeUserRelation("workspace",
                   relationship.Resource.ObjectId, []string{"workspace_admin"}, relationship.Subject.Object.ObjectId,
                   v1.RelationshipUpdate_OPERATION_DELETE)

            if err != nil {
                logger.Errorf("Removal of workspace admins for org admins - unable to remove workspace_admin role for user %s: %v", userID, err)
            }
        }
	}

    logger.Info("Removal of workspace admins for org admins - stop")
}