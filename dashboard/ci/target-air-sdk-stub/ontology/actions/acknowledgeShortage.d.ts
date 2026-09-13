import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Shortage } from '../objects/Shortage.js';
export declare namespace acknowledgeShortage {
    type ParamsDefinition = {
        expectedRecoveryDate: {
            description: undefined;
            displayName: 'Expected Recovery Date';
            multiplicity: false;
            nullable: true;
            type: 'datetime';
        };
        shortage: {
            description: undefined;
            displayName: 'Shortage';
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<Shortage>;
        };
        status: {
            description: undefined;
            displayName: 'Status';
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
    };
    /**
     * Acknowledge a shortage and revise its expected recovery date.
     */
    interface Params {
        readonly expectedRecoveryDate?: ActionParam.PrimitiveType<'datetime'> | null;
        readonly shortage: ActionParam.ObjectType<Shortage>;
        readonly status?: ActionParam.PrimitiveType<'string'> | null;
    }
    interface Signatures {
        /**
         * Acknowledge a shortage and revise its expected recovery date.
         */
        applyAction<OP extends ApplyActionOptions>(args: acknowledgeShortage.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<acknowledgeShortage.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Acknowledge a shortage and revise its expected recovery date.
 *
 * **Note on null values:** _For optional parameters, explicitly providing a null value instead of undefined
 * can change the behavior of the applied action. If prefills are configured, null prevents them
 * from being applied. If a parameter modifies an object's property, null will clear the data from
 * the object, whereas undefined would not modify that property._
 * @param {ActionParam.PrimitiveType<"datetime">} [expectedRecoveryDate]
 * @param {ActionParam.ObjectType<Shortage>} shortage
 * @param {ActionParam.PrimitiveType<"string">} [status]
 */
export interface acknowledgeShortage extends ActionDefinition<acknowledgeShortage.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'acknowledgeShortage';
        description: 'Acknowledge a shortage and revise its expected recovery date.';
        displayName: 'Acknowledge shortage';
        modifiedEntities: {
            Shortage: {
                created: false;
                modified: true;
            };
        };
        parameters: acknowledgeShortage.ParamsDefinition;
        rid: 'ri.actions.main.action-type.9e6578aa-4b57-4ca1-a157-2e6c9b3d6d26';
        status: 'EXPERIMENTAL';
        type: 'action';
        unsanitizedApiName: 'acknowledge-shortage';
        signatures: acknowledgeShortage.Signatures;
    };
    apiName: 'acknowledgeShortage';
    type: 'action';
    unsanitizedApiName: 'acknowledge-shortage';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const acknowledgeShortage: acknowledgeShortage;
