const wsdl = `
<definitions name="SoporteService"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://example.com/soporte"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  targetNamespace="http://example.com/soporte">

  <types>
    <xsd:schema targetNamespace="http://example.com/soporte">
      <!-- Crear un ticket -->
      <xsd:element name="createTicketRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="usuario_id" type="xsd:int" />
            <xsd:element name="mensaje" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="createTicketResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="message" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <!-- Obtener estado de un ticket -->
      <xsd:element name="getTicketStatusRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="getTicketStatusResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="estado" type="xsd:string" />
            <xsd:element name="mensaje" type="xsd:string" />
            <xsd:element name="historial" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <!-- Cerrar un ticket -->
      <xsd:element name="closeTicketRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="closeTicketResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="message" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <!-- Listar tickets abiertos -->
      <xsd:element name="listTicketsRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="usuario_id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="listTicketsResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="tickets" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="createTicketRequest">
    <part name="parameters" element="tns:createTicketRequest" />
  </message>
  <message name="createTicketResponse">
    <part name="parameters" element="tns:createTicketResponse" />
  </message>
  <message name="getTicketStatusRequest">
    <part name="parameters" element="tns:getTicketStatusRequest" />
  </message>
  <message name="getTicketStatusResponse">
    <part name="parameters" element="tns:getTicketStatusResponse" />
  </message>
  <message name="closeTicketRequest">
    <part name="parameters" element="tns:closeTicketRequest" />
  </message>
  <message name="closeTicketResponse">
    <part name="parameters" element="tns:closeTicketResponse" />
  </message>
  <message name="listTicketsRequest">
    <part name="parameters" element="tns:listTicketsRequest" />
  </message>
  <message name="listTicketsResponse">
    <part name="parameters" element="tns:listTicketsResponse" />
  </message>

  <portType name="SoportePortType">
    <operation name="createTicket">
      <input message="tns:createTicketRequest" />
      <output message="tns:createTicketResponse" />
    </operation>
    <operation name="getTicketStatus">
      <input message="tns:getTicketStatusRequest" />
      <output message="tns:getTicketStatusResponse" />
    </operation>
    <operation name="closeTicket">
      <input message="tns:closeTicketRequest" />
      <output message="tns:closeTicketResponse" />
    </operation>
    <operation name="listTickets">
      <input message="tns:listTicketsRequest" />
      <output message="tns:listTicketsResponse" />
    </operation>
  </portType>

  <binding name="SoportePortBinding" type="tns:SoportePortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http" />
    <operation name="createTicket">
      <soap:operation soapAction="http://example.com/soporte/createTicket" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="getTicketStatus">
      <soap:operation soapAction="http://example.com/soporte/getTicketStatus" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="closeTicket">
      <soap:operation soapAction="http://example.com/soporte/closeTicket" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="listTickets">
      <soap:operation soapAction="http://example.com/soporte/listTickets" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
  </binding>

  <service name="SoporteService">
    <port name="SoportePort" binding="tns:SoportePortBinding">
      <soap:address location="http://localhost:3004/soap" />
    </port>
  </service>
</definitions>
`;

module.exports = wsdl;
