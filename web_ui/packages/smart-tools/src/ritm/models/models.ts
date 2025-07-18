// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

export const RITMModels = {
    main: new URL('./main.onnx', import.meta.url).toString(),
    preprocess: new URL('./preprocess.onnx', import.meta.url).toString(),
};
