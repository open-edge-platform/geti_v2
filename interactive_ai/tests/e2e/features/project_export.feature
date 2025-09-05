# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

Feature: project export
  The user can export a project as a zip file with all, none or the latest active models.

  Background: Geti platform with a workspace
    Given a workspace

  Scenario Outline: Project export with models
   Given a trained project of type 'detection'
   When the user requests to export the project with '<included_models>'
    Then a job of type 'export_project' is scheduled
    And the job completes successfully within 3 minutes
    And the exported project can be downloaded and is <exported_project_size> MB

    @wip
    Examples:
    | included_models | exported_project_size |
    | none            | 8                     |
    | latest_active   | 49                    |
    | all             | 69                    |   
