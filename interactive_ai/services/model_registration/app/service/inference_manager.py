# Copyright (C) 2022-2025 Intel Corporation
# LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import asyncio

from geti_logger_tools.logger_config import initialize_logger

from service.inference_service import InferenceService

logger = initialize_logger(__name__)


class InferenceManager:
    async def create_inference(self, name: str, namespace: str, storage_name: str, path: str) -> None:
        """Create inferenceservice resource"""
        logger.info(f"Creating InferenceService for {name}")
        inference = InferenceService(name=name, namespace=namespace, storage_name=storage_name, path=path)
        await inference.create()
        create_timeout = 300
        for _ in range(create_timeout):
            await asyncio.sleep(0.1)
            inference_service: InferenceService | None = await InferenceService.get(name=name, namespace=namespace)  # type: ignore
            if inference_service and inference_service.status and "conditions" in inference_service.status:
                for condition in inference_service.status["conditions"]:
                    if condition.get("type") == "Ready" and condition.get("status") == "True":
                        break
                else:
                    continue
                break
        else:
            raise RuntimeError(f"Failed to create {name} InferenceService")
        logger.info(f"Created InferenceService for {name}")

    async def remove_inference(self, name: str, namespace: str) -> None:
        """Deletes specific inferenceservice resource."""
        logger.info(f"Removing InferenceService for {name}")
        deletion_timeout = 600

        inference_service: InferenceService | None = await InferenceService.get(name=name, namespace=namespace)  # type: ignore

        if inference_service:
            await inference_service.delete(propagation_policy="Foreground")
            for _ in range(deletion_timeout):
                inference_service: InferenceService | None = await InferenceService.get(name=name, namespace=namespace)  # type: ignore
                if not inference_service:
                    break
                await asyncio.sleep(0.1)
            else:
                raise RuntimeError(f"Failed to remove {name} InferenceService")
            logger.info(f"Removed {name} InferenceService")
        else:
            raise RuntimeError(f"InferenceService {name} not found")

    async def list_inference(self, namespace: str) -> list[InferenceService]:
        """List registered inferenceservice resources."""
        logger.info(f"Listing items in InferenceService within namespace `{namespace}`")
        return await InferenceService.list(namespace=namespace)  # type: ignore

    async def get_inference(self, name: str, namespace: str) -> InferenceService | None:
        """Get specific inferenceservice resource."""
        logger.info(f"Getting InferenceService for {name}")
        inference_service: InferenceService | None = await InferenceService.get(name=name, namespace=namespace)  # type: ignore
        return inference_service
