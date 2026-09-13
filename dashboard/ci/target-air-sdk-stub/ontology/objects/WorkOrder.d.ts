import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Shortage } from './Shortage.js';
import type { Station } from './Station.js';
import type { Aircraft } from './Aircraft.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace WorkOrder {
    type PropertyKeys = 'completedDate' | 'hoursBooked' | 'serialNumber' | 'standardHours' | 'startedDate' | 'stationCode' | 'status' | 'workOrderId';
    interface Links {
        readonly aircraft: $SingleLinkAccessor<Aircraft>;
        readonly shortages: Shortage.ObjectSet;
        readonly station: $SingleLinkAccessor<Station>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Completed Date'
         */
        readonly completedDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Hours Booked'
         */
        readonly hoursBooked: $PropType['integer'] | undefined;
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
         *   display name: 'Standard Hours'
         */
        readonly standardHours: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Started Date'
         */
        readonly startedDate: $PropType['datetime'] | undefined;
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
        readonly workOrderId: $PropType['string'];
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<WorkOrder, WorkOrder.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof WorkOrder.Props = keyof WorkOrder.Props> = $Osdk.Instance<WorkOrder, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof WorkOrder.Props = keyof WorkOrder.Props> = OsdkInstance<OPTIONS, K>;
}
export interface WorkOrder extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'WorkOrder';
    primaryKeyApiName: 'workOrderId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: WorkOrder.ObjectSet;
        props: WorkOrder.Props;
        linksType: WorkOrder.Links;
        strictProps: WorkOrder.StrictProps;
        apiName: 'WorkOrder';
        description: 'A job on one aircraft at one station. Hours booked against standard shows where time is going.';
        displayName: 'Work Order';
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
            shortages: $ObjectMetadata.Link<Shortage, true>;
            station: $ObjectMetadata.Link<Station, false>;
        };
        pluralDisplayName: 'Work Orders';
        primaryKeyApiName: 'workOrderId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Completed Date'
             */
            completedDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Hours Booked'
             */
            hoursBooked: $PropertyDef<'integer', 'nullable', 'single'>;
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
             *   display name: 'Standard Hours'
             */
            standardHours: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Started Date'
             */
            startedDate: $PropertyDef<'datetime', 'nullable', 'single'>;
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
            workOrderId: $PropertyDef<'string', 'non-nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.2bf5eb08-ab4a-498e-accf-28ea6ee0d3ec';
        status: 'EXPERIMENTAL';
        titleProperty: 'workOrderId';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const WorkOrder: WorkOrder;
