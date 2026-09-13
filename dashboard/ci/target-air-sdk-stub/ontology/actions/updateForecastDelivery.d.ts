import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Aircraft } from '../objects/Aircraft.js';
export declare namespace updateForecastDelivery {
    type ParamsDefinition = {
        aircraft: {
            description: undefined;
            displayName: 'Aircraft';
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<Aircraft>;
        };
        forecastDeliveryDate: {
            description: undefined;
            displayName: 'Forecast Delivery Date';
            multiplicity: false;
            nullable: true;
            type: 'datetime';
        };
    };
    /**
     * Re-forecast a tail's delivery date when the line says it has moved.
     */
    interface Params {
        readonly aircraft: ActionParam.ObjectType<Aircraft>;
        readonly forecastDeliveryDate?: ActionParam.PrimitiveType<'datetime'> | null;
    }
    interface Signatures {
        /**
         * Re-forecast a tail's delivery date when the line says it has moved.
         */
        applyAction<OP extends ApplyActionOptions>(args: updateForecastDelivery.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<updateForecastDelivery.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Re-forecast a tail's delivery date when the line says it has moved.
 *
 * **Note on null values:** _For optional parameters, explicitly providing a null value instead of undefined
 * can change the behavior of the applied action. If prefills are configured, null prevents them
 * from being applied. If a parameter modifies an object's property, null will clear the data from
 * the object, whereas undefined would not modify that property._
 * @param {ActionParam.ObjectType<Aircraft>} aircraft
 * @param {ActionParam.PrimitiveType<"datetime">} [forecastDeliveryDate]
 */
export interface updateForecastDelivery extends ActionDefinition<updateForecastDelivery.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'updateForecastDelivery';
        description: "Re-forecast a tail's delivery date when the line says it has moved.";
        displayName: 'Update forecast delivery';
        modifiedEntities: {
            Aircraft: {
                created: false;
                modified: true;
            };
        };
        parameters: updateForecastDelivery.ParamsDefinition;
        rid: 'ri.actions.main.action-type.1852b7d2-d512-45fb-b240-6388fc6ccfa2';
        status: 'EXPERIMENTAL';
        type: 'action';
        unsanitizedApiName: 'update-forecast-delivery';
        signatures: updateForecastDelivery.Signatures;
    };
    apiName: 'updateForecastDelivery';
    type: 'action';
    unsanitizedApiName: 'update-forecast-delivery';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const updateForecastDelivery: updateForecastDelivery;
