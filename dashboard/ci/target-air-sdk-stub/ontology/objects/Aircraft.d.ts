import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NonConformance } from './NonConformance.js';
import type { Shortage } from './Shortage.js';
import type { Station } from './Station.js';
import type { WorkOrder } from './WorkOrder.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace Aircraft {
    type PropertyKeys = 'buildStartDate' | 'currentStationCode' | 'customer' | 'forecastDeliveryDate' | 'plannedDeliveryDate' | 'program' | 'serialNumber' | 'status';
    interface Links {
        readonly nonConformances: NonConformance.ObjectSet;
        readonly shortages: Shortage.ObjectSet;
        readonly station: $SingleLinkAccessor<Station>;
        readonly workOrders: WorkOrder.ObjectSet;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Build Start Date'
         */
        readonly buildStartDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Current Station Code'
         */
        readonly currentStationCode: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Customer'
         */
        readonly customer: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Forecast Delivery Date'
         */
        readonly forecastDeliveryDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Planned Delivery Date'
         */
        readonly plannedDeliveryDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Program'
         */
        readonly program: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Serial Number'
         */
        readonly serialNumber: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Status'
         */
        readonly status: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Aircraft, Aircraft.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Aircraft.Props = keyof Aircraft.Props> = $Osdk.Instance<Aircraft, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Aircraft.Props = keyof Aircraft.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Aircraft extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Aircraft';
    primaryKeyApiName: 'serialNumber';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: Aircraft.ObjectSet;
        props: Aircraft.Props;
        linksType: Aircraft.Links;
        strictProps: Aircraft.StrictProps;
        apiName: 'Aircraft';
        description: 'An airframe in build or delivered. Forecast against planned delivery is the schedule signal.';
        displayName: 'Aircraft';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            nonConformances: $ObjectMetadata.Link<NonConformance, true>;
            shortages: $ObjectMetadata.Link<Shortage, true>;
            station: $ObjectMetadata.Link<Station, false>;
            workOrders: $ObjectMetadata.Link<WorkOrder, true>;
        };
        pluralDisplayName: 'Aircraft';
        primaryKeyApiName: 'serialNumber';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Build Start Date'
             */
            buildStartDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Current Station Code'
             */
            currentStationCode: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Customer'
             */
            customer: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Forecast Delivery Date'
             */
            forecastDeliveryDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Planned Delivery Date'
             */
            plannedDeliveryDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Program'
             */
            program: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Serial Number'
             */
            serialNumber: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Status'
             */
            status: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.60f6d1f2-4e16-4e9a-8f94-d6873416a7d4';
        status: 'EXPERIMENTAL';
        titleProperty: 'serialNumber';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Aircraft: Aircraft;
