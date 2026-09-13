import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Aircraft } from './Aircraft.js';
import type { Station } from './Station.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace NonConformance {
    type PropertyKeys = 'closedDate' | 'description' | 'disposition' | 'ncrId' | 'openedDate' | 'serialNumber' | 'severity' | 'stationCode' | 'status';
    interface Links {
        readonly aircraft: $SingleLinkAccessor<Aircraft>;
        readonly station: $SingleLinkAccessor<Station>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Closed Date'
         */
        readonly closedDate: $PropType['datetime'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Description'
         */
        readonly description: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Disposition'
         */
        readonly disposition: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Ncr Id'
         */
        readonly ncrId: $PropType['string'];
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
         *   display name: 'Serial Number'
         */
        readonly serialNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Severity'
         */
        readonly severity: $PropType['string'] | undefined;
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
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<NonConformance, NonConformance.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof NonConformance.Props = keyof NonConformance.Props> = $Osdk.Instance<NonConformance, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof NonConformance.Props = keyof NonConformance.Props> = OsdkInstance<OPTIONS, K>;
}
export interface NonConformance extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'NonConformance';
    primaryKeyApiName: 'ncrId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: NonConformance.ObjectSet;
        props: NonConformance.Props;
        linksType: NonConformance.Links;
        strictProps: NonConformance.StrictProps;
        apiName: 'NonConformance';
        description: 'Something built out of spec. Severity and disposition decide whether the aircraft moves.';
        displayName: 'Non Conformance';
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
            station: $ObjectMetadata.Link<Station, false>;
        };
        pluralDisplayName: 'Non Conformances';
        primaryKeyApiName: 'ncrId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Closed Date'
             */
            closedDate: $PropertyDef<'datetime', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Description'
             */
            description: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Disposition'
             */
            disposition: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Ncr Id'
             */
            ncrId: $PropertyDef<'string', 'non-nullable', 'single'>;
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
             *   display name: 'Serial Number'
             */
            serialNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Severity'
             */
            severity: $PropertyDef<'string', 'nullable', 'single'>;
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
        };
        rid: 'ri.ontology.main.object-type.39c0c333-4654-4254-9300-f19953495b6d';
        status: 'EXPERIMENTAL';
        titleProperty: 'ncrId';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const NonConformance: NonConformance;
