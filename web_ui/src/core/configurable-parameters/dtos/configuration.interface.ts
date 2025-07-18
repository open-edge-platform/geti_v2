// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

interface ParameterBaseDTO {
    key: string;
    name: string;
    description: string;
}

interface NumberParameterDTO extends ParameterBaseDTO {
    type: 'int' | 'float';
    value: number;
    min_value: number;
    max_value: number | null;
    default_value: number;
}

interface BoolParameterDTO extends ParameterBaseDTO {
    type: 'bool';
    value: boolean;
    default_value: boolean;
}

interface EnumParameterDTO<T extends string | boolean | number> extends ParameterBaseDTO {
    type: 'enum';
    value: T;
    default_value: T;
    allowed_values: T[];
}

export interface StaticParameterDTO extends ParameterBaseDTO {
    value: number | boolean;
}

export type ConfigurationParameterDTO = BoolParameterDTO | NumberParameterDTO | EnumParameterDTO<number>;

interface ProjectConfigurationTaskConfigsTrainingDTO {
    constraints: ConfigurationParameterDTO[];
}

interface ProjectConfigurationTaskConfigsDTO {
    task_id: string;
    training: ProjectConfigurationTaskConfigsTrainingDTO;
    auto_training: ConfigurationParameterDTO[];
}

type KeyValueParameterDTO = Pick<ConfigurationParameterDTO, 'key' | 'value'>;

export interface ProjectConfigurationUploadPayloadDTO {
    task_configs: {
        task_id: string;
        training?: { constraints: KeyValueParameterDTO[] };
        auto_training?: KeyValueParameterDTO[];
    }[];
}

export interface ProjectConfigurationDTO {
    task_configs: ProjectConfigurationTaskConfigsDTO[];
}

export type DatasetPreparationParametersDTO = {
    subset_split: ConfigurationParameterDTO[];
    filtering: Record<string, ConfigurationParameterDTO[]>;
    augmentation: Record<string, ConfigurationParameterDTO[]>;
};

export type TrainingParametersDTO = (ConfigurationParameterDTO | Record<string, ConfigurationParameterDTO[]>)[];

export interface TrainingConfigurationDTO {
    dataset_preparation: DatasetPreparationParametersDTO;
    training: TrainingParametersDTO;
    evaluation: ConfigurationParameterDTO[];
    task_id: string;
}

export interface TrainedModelConfigurationDTO extends Omit<TrainingConfigurationDTO, 'dataset_preparation'> {
    dataset_preparation: Pick<DatasetPreparationParametersDTO, 'augmentation'>;
    advanced_configuration: StaticParameterDTO[];
}

export interface TrainingConfigurationUpdatePayloadDTO {
    dataset_preparation?: {
        subset_split?: KeyValueParameterDTO[];
        filtering?: Record<string, KeyValueParameterDTO[]>;
        augmentation?: Record<string, KeyValueParameterDTO[]>;
    };
    training?: (KeyValueParameterDTO | Record<string, KeyValueParameterDTO[]>)[];
    evaluation?: KeyValueParameterDTO[];
    advanced_configuration?: KeyValueParameterDTO[];
    task_id: string;
}
