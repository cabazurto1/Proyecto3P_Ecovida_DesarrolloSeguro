const wsdl = `
<definitions name="ProductoService"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://example.com/producto"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  targetNamespace="http://example.com/producto">
  
  <types>
    <xsd:schema targetNamespace="http://example.com/producto">
      <xsd:element name="getProductStockRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="getProductStockResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="stock" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="updateProductStockRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
            <xsd:element name="stock" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="updateProductStockResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="message" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="getProductLogsRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="getProductLogsResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="logs" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="notifyStockChangeRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="id" type="xsd:int" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="notifyStockChangeResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="message" type="xsd:string" />
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="getProductStockRequest">
    <part name="parameters" element="tns:getProductStockRequest" />
  </message>
  <message name="getProductStockResponse">
    <part name="parameters" element="tns:getProductStockResponse" />
  </message>

  <message name="updateProductStockRequest">
    <part name="parameters" element="tns:updateProductStockRequest" />
  </message>
  <message name="updateProductStockResponse">
    <part name="parameters" element="tns:updateProductStockResponse" />
  </message>

  <message name="getProductLogsRequest">
    <part name="parameters" element="tns:getProductLogsRequest" />
  </message>
  <message name="getProductLogsResponse">
    <part name="parameters" element="tns:getProductLogsResponse" />
  </message>

  <message name="notifyStockChangeRequest">
    <part name="parameters" element="tns:notifyStockChangeRequest" />
  </message>
  <message name="notifyStockChangeResponse">
    <part name="parameters" element="tns:notifyStockChangeResponse" />
  </message>

  <portType name="ProductoPortType">
    <operation name="getProductStock">
      <input message="tns:getProductStockRequest" />
      <output message="tns:getProductStockResponse" />
    </operation>
    <operation name="updateProductStock">
      <input message="tns:updateProductStockRequest" />
      <output message="tns:updateProductStockResponse" />
    </operation>
    <operation name="getProductLogs">
      <input message="tns:getProductLogsRequest" />
      <output message="tns:getProductLogsResponse" />
    </operation>
    <operation name="notifyStockChange">
      <input message="tns:notifyStockChangeRequest" />
      <output message="tns:notifyStockChangeResponse" />
    </operation>
  </portType>

  <binding name="ProductoPortBinding" type="tns:ProductoPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http" />
    <operation name="getProductStock">
      <soap:operation soapAction="http://example.com/producto/getProductStock" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="updateProductStock">
      <soap:operation soapAction="http://example.com/producto/updateProductStock" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="getProductLogs">
      <soap:operation soapAction="http://example.com/producto/getProductLogs" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
    <operation name="notifyStockChange">
      <soap:operation soapAction="http://example.com/producto/notifyStockChange" />
      <input><soap:body use="literal" /></input>
      <output><soap:body use="literal" /></output>
    </operation>
  </binding>

  <service name="ProductoService">
    <port name="ProductoPort" binding="tns:ProductoPortBinding">
      <soap:address location="http://localhost:3001/soap" />
    </port>
  </service>
</definitions>
`;

module.exports = wsdl;
