# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

Feature: label reordering
  The user can reorder labels to projects of all types.

  Background: Geti platform with a workspace
    Given a workspace

  Scenario Outline: label reordering for some project types
    Given a project of type '<project_type>' with labels 'foo, bar, baz'
      When the user reorders the labels to 'foo, baz, bar' 
      Then the project has labels 'foo, baz, bar' in this order

    @smoke
    Examples:
      | project_type               |
      | multiclass classification  |

    Examples:
      | project_type               |
      | detection                  |
      | instance segmentation      |
      | detection > classification |
