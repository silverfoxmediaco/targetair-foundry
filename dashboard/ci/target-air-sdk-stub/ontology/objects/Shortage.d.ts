import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Aircraft } from './Aircraft.js';
import type { WorkOrder } from './WorkOrder.js';
import type { Station } from './Station.js';
import type { Part } from './Part.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace Shortage {
    type PropertyKeys = 'criticality' | 'expectedRecoveryDate' | 'openedDate' | 'partNumber' | 'qtyShort' | 'serialNumber' | 'shortageId' | 'stationCode' | 'status' | 'workOrderId';
    interface Links {
        readonly aircraft: $SingleLinkAccessor<Aircraft>;
        readonly part: $SingleLinkAccessor<Part>;
        readonly station: $SingleLinkAccessor<Station>;
        readonly workOrder: $SingleLinkAccessor<WorkOrder>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Criticality'
         */
        readonly criticality: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Expected Recovery Date'
         */
        readonly expectedRecoveryDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Opened Date'
         */
        readonly openedDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Part Number'
         */
        readonly partNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Qty Short'
         */
        readonly qtyShort: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Serial Number'
         */
        readonly serialNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Shortage Id'
         */
        readonly shortageId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Station Code'
         */
        readonly stationCode: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Status'
         */
        readonly status: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Work Order Id'
         */
        readonly workOrderId: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Shortage, Shortage.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Shortage.Props = keyof Shortage.Props> = $Osdk.Instance<Shortage, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Shortage.Props = keyof Shortage.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Shortage extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Shortage';
    primaryKeyApiName: 'shortageId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: Shortage.ObjectSet;
        props: Shortage.Props;
        linksType: Shortage.Links;
        strictProps: Shortage.StrictProps;
        apiName: 'Shortage';
        description: 'A missing part blocking a work order. The link between supply chain and the line stopping.';
        displayName: 'Shortage';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            aircraft: $ObjectMetadata.Link<Aircraft, false>;
            part: $ObjectMetadata.Link<Part, false>;
            station: $ObjectMetadata.Link<Station, false>;
            workOrder: $ObjectMetadata.Link<WorkOrder, false>;
        };
        pluralDisplayName: 'Shortages';
        primaryKeyApiName: 'shortageId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Criticality'
             */
            criticality: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Expected Recovery Date'
             */
            expectedRecoveryDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Opened Date'
             */
            openedDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Part Number'
             */
            partNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Qty Short'
             */
            qtyShort: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Serial Number'
             */
            serialNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Shortage Id'
             */
            shortageId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Station Code'
             */
            stationCode: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Status'
             */
            status: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Work Order Id'
             */
            workOrderId: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.cb9db308-5ccb-406d-8828-e811f765062d';
        status: 'EXPERIMENTAL';
        titleProperty: 'shortageId';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Shortage: Shortage;
