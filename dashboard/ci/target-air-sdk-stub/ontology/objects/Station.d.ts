import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { NonConformance } from './NonConformance.js';
import type { WorkOrder } from './WorkOrder.js';
import type { Shortage } from './Shortage.js';
import type { BomLine } from './BomLine.js';
import type { Aircraft } from './Aircraft.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace Station {
    type PropertyKeys = 'avgCycleDays' | 'sequence' | 'standardHours' | 'stationCode' | 'stationName' | 'taktDays';
    interface Links {
        readonly aircraft: Aircraft.ObjectSet;
        readonly bomLines: BomLine.ObjectSet;
        readonly nonConformances: NonConformance.ObjectSet;
        readonly shortages: Shortage.ObjectSet;
        readonly workOrders: WorkOrder.ObjectSet;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Avg Cycle Days'
         */
        readonly avgCycleDays: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Sequence'
         */
        readonly sequence: $PropType['integer'] | undefined;
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
         *   display name: 'Station Code'
         */
        readonly stationCode: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Station Name'
         */
        readonly stationName: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Takt Days'
         */
        readonly taktDays: $PropType['integer'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Station, Station.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Station.Props = keyof Station.Props> = $Osdk.Instance<Station, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Station.Props = keyof Station.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Station extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Station';
    primaryKeyApiName: 'stationCode';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: Station.ObjectSet;
        props: Station.Props;
        linksType: Station.Links;
        strictProps: Station.StrictProps;
        apiName: 'Station';
        description: 'A position on the assembly line where a defined set of work happens. Aircraft move through stations in sequence.';
        displayName: 'Station';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            aircraft: $ObjectMetadata.Link<Aircraft, true>;
            bomLines: $ObjectMetadata.Link<BomLine, true>;
            nonConformances: $ObjectMetadata.Link<NonConformance, true>;
            shortages: $ObjectMetadata.Link<Shortage, true>;
            workOrders: $ObjectMetadata.Link<WorkOrder, true>;
        };
        pluralDisplayName: 'Stations';
        primaryKeyApiName: 'stationCode';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Avg Cycle Days'
             */
            avgCycleDays: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Sequence'
             */
            sequence: $PropertyDef<'integer', 'nullable', 'single'>;
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
             *   display name: 'Station Code'
             */
            stationCode: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Station Name'
             */
            stationName: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Takt Days'
             */
            taktDays: $PropertyDef<'integer', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.278a206c-c9b9-43ec-a53b-7ba2a39be348';
        status: 'EXPERIMENTAL';
        titleProperty: 'stationName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Station: Station;
