import type { ActionDefinition, ActionMetadata, ActionParam, ActionReturnTypeForOptions, ApplyActionOptions, ApplyBatchActionOptions } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NonConformance } from '../objects/NonConformance.js';
export declare namespace dispositionNonConformance {
    type ParamsDefinition = {
        closedDate: {
            description: undefined;
            displayName: 'Closed Date';
            multiplicity: false;
            nullable: true;
            type: 'datetime';
        };
        disposition: {
            description: undefined;
            displayName: 'Disposition';
            multiplicity: false;
            nullable: true;
            type: 'string';
        };
        nonConformance: {
            description: undefined;
            displayName: 'Non Conformance';
            multiplicity: false;
            nullable: false;
            type: ActionMetadata.DataType.Object<NonConformance>;
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
     * Record the disposition of a non-conformance and close it out.
     */
    interface Params {
        readonly closedDate?: ActionParam.PrimitiveType<'datetime'> | null;
        readonly disposition?: ActionParam.PrimitiveType<'string'> | null;
        readonly nonConformance: ActionParam.ObjectType<NonConformance>;
        readonly status?: ActionParam.PrimitiveType<'string'> | null;
    }
    interface Signatures {
        /**
         * Record the disposition of a non-conformance and close it out.
         */
        applyAction<OP extends ApplyActionOptions>(args: dispositionNonConformance.Params, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
        batchApplyAction<OP extends ApplyBatchActionOptions>(args: ReadonlyArray<dispositionNonConformance.Params>, options?: OP): Promise<ActionReturnTypeForOptions<OP>>;
    }
}
/**
 * Record the disposition of a non-conformance and close it out.
 *
 * **Note on null values:** _For optional parameters, explicitly providing a null value instead of undefined
 * can change the behavior of the applied action. If prefills are configured, null prevents them
 * from being applied. If a parameter modifies an object's property, null will clear the data from
 * the object, whereas undefined would not modify that property._
 * @param {ActionParam.PrimitiveType<"datetime">} [closedDate]
 * @param {ActionParam.PrimitiveType<"string">} [disposition]
 * @param {ActionParam.ObjectType<NonConformance>} nonConformance
 * @param {ActionParam.PrimitiveType<"string">} [status]
 */
export interface dispositionNonConformance extends ActionDefinition<dispositionNonConformance.Signatures> {
    __DefinitionMetadata?: {
        apiName: 'dispositionNonConformance';
        description: 'Record the disposition of a non-conformance and close it out.';
        displayName: 'Disposition non-conformance';
        modifiedEntities: {
            NonConformance: {
                created: false;
                modified: true;
            };
        };
        parameters: dispositionNonConformance.ParamsDefinition;
        rid: 'ri.actions.main.action-type.7e00b4b9-4197-4afd-95b1-945326be2191';
        status: 'EXPERIMENTAL';
        type: 'action';
        unsanitizedApiName: 'disposition-non-conformance';
        signatures: dispositionNonConformance.Signatures;
    };
    apiName: 'dispositionNonConformance';
    type: 'action';
    unsanitizedApiName: 'disposition-non-conformance';
    osdkMetadata: typeof $osdkMetadata;
}
export declare const dispositionNonConformance: dispositionNonConformance;
